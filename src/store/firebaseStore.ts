import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from 'firebase/auth'
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { makeGroupCode, normalizeCode } from '../lib/codes'
import { GAME_MAP, nextGameId } from '../games/catalog'
import { getFirebase } from '../lib/firebase'
import { closeRoundScoring, emptyMember, resetSeasonMember } from '../lib/scoring'
import type { GameId, Group, GroupSnapshot, Member, PlayRecord, Round, UserProfile } from '../types'
import { defaultSettings, firstRound, type AuthAPI, type StoreAPI } from './types'

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export const firebaseAuth: AuthAPI = {
  subscribe(cb) {
    const { auth } = getFirebase()
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        cb(null)
        return
      }
      const provider = user.providerData[0]?.providerId === 'apple.com' ? 'apple' : 'google'
      cb({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
        provider,
      })
    })
  },
  async signInGoogle() {
    const { auth } = getFirebase()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    if (isMobile()) await signInWithRedirect(auth, provider)
    else await signInWithPopup(auth, provider)
  },
  async signInApple() {
    const { auth } = getFirebase()
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    if (isMobile()) await signInWithRedirect(auth, provider)
    else await signInWithPopup(auth, provider)
  },
  async signInLocal() {
    throw new Error('En Firebase entra con Google o Apple')
  },
  async signOut() {
    await fbSignOut(getFirebase().auth)
  },
}

function userRef(uid: string) {
  return doc(getFirebase().db, 'users', uid)
}
function groupRef(id: string) {
  return doc(getFirebase().db, 'groups', id)
}
function codeRef(code: string) {
  return doc(getFirebase().db, 'groupCodes', code)
}
function memberRef(groupId: string, uid: string) {
  return doc(getFirebase().db, 'groups', groupId, 'members', uid)
}
function roundRef(groupId: string, roundId: string) {
  return doc(getFirebase().db, 'groups', groupId, 'rounds', roundId)
}
function playRef(groupId: string, roundId: string, uid: string) {
  return doc(getFirebase().db, 'groups', groupId, 'rounds', roundId, 'plays', uid)
}

export const firebaseStore: StoreAPI = {
  async ensureUser(session, nickname) {
    const ref = userRef(session.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data() as UserProfile
      if (nickname && nickname !== data.displayName) {
        await updateDoc(ref, { displayName: nickname })
        data.displayName = nickname
      }
      return data
    }
    const profile: UserProfile = {
      uid: session.uid,
      displayName: nickname || session.displayName || 'Jugador',
      photoURL: session.photoURL,
      email: session.email,
      createdAt: Date.now(),
      groupIds: [],
    }
    await setDoc(ref, { ...profile, createdAtServer: serverTimestamp() })
    return profile
  },

  watchProfile(uid, cb) {
    return onSnapshot(userRef(uid), (snap) => {
      cb(snap.exists() ? (snap.data() as UserProfile) : null)
    })
  },

  async updateNickname(uid, name) {
    const clean = name.trim().slice(0, 20)
    const { db } = getFirebase()
    const userSnap = await getDoc(userRef(uid))
    const groupIds = (userSnap.data() as UserProfile | undefined)?.groupIds ?? []
    const batch = writeBatch(db)
    batch.update(userRef(uid), { displayName: clean })
    for (const gid of groupIds) batch.update(memberRef(gid, uid), { displayName: clean })
    await batch.commit()
  },

  watchMyGroups(uid, cb) {
    return onSnapshot(userRef(uid), async (snap) => {
      const ids = (snap.data() as UserProfile | undefined)?.groupIds ?? []
      const groups = (
        await Promise.all(
          ids.map(async (id) => {
            const g = await getDoc(groupRef(id))
            const m = await getDoc(memberRef(id, uid))
            if (!g.exists()) return null
            const data = g.data() as Group
            return {
              id: data.id,
              name: data.name,
              code: data.code,
              seasonPoints: (m.data() as Member | undefined)?.seasonPoints,
            }
          }),
        )
      ).filter(Boolean) as { id: string; name: string; code: string; seasonPoints?: number }[]
      cb(groups)
    })
  },

  async createGroup(uid, name, displayName, photoURL) {
    const { db } = getFirebase()
    const id = doc(collection(db, 'groups')).id
    const code = makeGroupCode()
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now()) >>> 0
    const gameId = nextGameId(null, seed)
    const settings = defaultSettings()
    const round = firstRound(id, gameId, seed, settings.timeoutHours)
    const group: Group = {
      id,
      name: name.trim().slice(0, 32) || 'Mi grupo',
      code,
      createdBy: uid,
      createdAt: Date.now(),
      seasonNumber: 1,
      currentRoundId: round.id,
      memberIds: [uid],
      settings,
    }
    await runTransaction(db, async (tx) => {
      const taken = await tx.get(codeRef(code))
      if (taken.exists()) throw new Error('Código repetido, inténtalo otra vez')
      const user = await tx.get(userRef(uid))
      const profile = user.data() as UserProfile
      tx.set(codeRef(code), { groupId: id })
      tx.set(groupRef(id), group)
      tx.set(memberRef(id, uid), emptyMember(uid, displayName, photoURL))
      tx.set(roundRef(id, round.id), round)
      tx.set(userRef(uid), { groupIds: [...(profile.groupIds ?? []), id] }, { merge: true })
    })
    return id
  },

  async joinGroup(uid, code, displayName, photoURL) {
    const { db } = getFirebase()
    const normalized = normalizeCode(code)
    const mapped = await getDoc(codeRef(normalized))
    if (!mapped.exists()) throw new Error('Ese código no existe')
    const groupId = (mapped.data() as { groupId: string }).groupId
    await runTransaction(db, async (tx) => {
      const g = await tx.get(groupRef(groupId))
      if (!g.exists()) throw new Error('El grupo ya no existe')
      const user = await tx.get(userRef(uid))
      const profile = user.data() as UserProfile
      const already = await tx.get(memberRef(groupId, uid))
      if (!already.exists()) {
        tx.set(memberRef(groupId, uid), emptyMember(uid, displayName, photoURL))
      }
      const ids = new Set(profile.groupIds ?? [])
      ids.add(groupId)
      tx.set(userRef(uid), { groupIds: [...ids] }, { merge: true })
      tx.update(groupRef(groupId), { memberIds: arrayUnion(uid) })
    })
    return groupId
  },

  watchGroup(groupId, cb) {
    let group: Group | null = null
    let members: Member[] = []
    let rounds: Round[] = []
    let plays: Record<string, PlayRecord> = {}
    let unsubPlays: (() => void) | null = null

    const emit = () => {
      if (!group) {
        cb(null)
        return
      }
      const round = rounds.find((r) => r.id === group!.currentRoundId) ?? rounds[0]
      if (!round) {
        cb(null)
        return
      }
      const snap: GroupSnapshot = {
        group,
        members,
        round,
        plays,
        history: rounds.filter((r) => r.status === 'closed').sort((a, b) => b.index - a.index).slice(0, 20),
      }
      cb(snap)
    }

    const attachPlays = (roundId: string) => {
      unsubPlays?.()
      unsubPlays = onSnapshot(
        collection(getFirebase().db, 'groups', groupId, 'rounds', roundId, 'plays'),
        (snap) => {
          plays = {}
          for (const d of snap.docs) plays[d.id] = d.data() as PlayRecord
          emit()
        },
      )
    }

    const unsubGroup = onSnapshot(groupRef(groupId), (snap) => {
      group = snap.exists() ? (snap.data() as Group) : null
      if (group) attachPlays(group.currentRoundId)
      emit()
    })
    const unsubMembers = onSnapshot(collection(getFirebase().db, 'groups', groupId, 'members'), (snap) => {
      members = snap.docs.map((d) => d.data() as Member)
      emit()
    })
    const unsubRounds = onSnapshot(collection(getFirebase().db, 'groups', groupId, 'rounds'), (snap) => {
      rounds = snap.docs.map((d) => d.data() as Round)
      emit()
    })

    return () => {
      unsubGroup()
      unsubMembers()
      unsubRounds()
      unsubPlays?.()
    }
  },

  async submitPlay(groupId, roundId, uid, kind, score) {
    const { db } = getFirebase()
    const record = await runTransaction(db, async (tx) => {
      const gSnap = await tx.get(groupRef(groupId))
      const rSnap = await tx.get(roundRef(groupId, roundId))
      if (!gSnap.exists() || !rSnap.exists()) throw new Error('Ronda no encontrada')
      const group = gSnap.data() as Group
      const round = rSnap.data() as Round
      if (round.status !== 'active') throw new Error('La ronda ya no está activa')
      const pSnap = await tx.get(playRef(groupId, roundId, uid))
      const prev: PlayRecord = (pSnap.data() as PlayRecord | undefined) ?? {
        uid,
        practiceScore: null,
        official: [],
        best: null,
        finished: false,
        usedLastAttempt: false,
        updatedAt: Date.now(),
      }
      if (prev.finished) throw new Error('Ya enviaste tus intentos')
      if (kind === 'practice') {
        if (prev.practiceScore != null) throw new Error('La práctica ya está usada')
        prev.practiceScore = score
      } else {
        if (prev.official.length >= group.settings.officialAttempts) throw new Error('No te quedan intentos')
        prev.official.push(score)
        const meta = GAME_MAP[round.gameId]
        prev.best = meta.direction === 'lower' ? Math.min(...prev.official) : Math.max(...prev.official)
        if (prev.official.length >= group.settings.officialAttempts) {
          prev.finished = true
          prev.usedLastAttempt = prev.official[prev.official.length - 1] === prev.best && prev.official.length > 1
        }
      }
      prev.updatedAt = Date.now()
      tx.set(playRef(groupId, roundId, uid), prev)
      return prev
    })

    const [membersSnap, playsSnap, groupSnap] = await Promise.all([
      getDocs(collection(db, 'groups', groupId, 'members')),
      getDocs(collection(db, 'groups', groupId, 'rounds', roundId, 'plays')),
      getDoc(groupRef(groupId)),
    ])
    const memberIds = membersSnap.docs.map((d) => d.id)
    const finished = new Set(
      playsSnap.docs.filter((d) => (d.data() as PlayRecord).finished).map((d) => d.id),
    )
    if (
      groupSnap.exists() &&
      (groupSnap.data() as Group).currentRoundId === roundId &&
      memberIds.length > 0 &&
      memberIds.every((id) => finished.has(id))
    ) {
      await firebaseStore.closeAndAdvance(groupId)
    }
    return record
  },

  async closeAndAdvance(groupId) {
    const { db } = getFirebase()
    await runTransaction(db, async (tx) => {
      const gSnap = await tx.get(groupRef(groupId))
      if (!gSnap.exists()) throw new Error('Grupo no encontrado')
      const group = gSnap.data() as Group
      const rSnap = await tx.get(roundRef(groupId, group.currentRoundId))
      if (!rSnap.exists()) return
      const round = rSnap.data() as Round
      if (round.status === 'closed') return

      const memberIds = group.memberIds ?? []
      const members: Member[] = []
      const plays: Record<string, PlayRecord> = {}
      for (const uid of memberIds) {
        const mSnap = await tx.get(memberRef(groupId, uid))
        if (mSnap.exists()) members.push(mSnap.data() as Member)
        const pSnap = await tx.get(playRef(groupId, round.id, uid))
        if (pSnap.exists()) plays[uid] = pSnap.data() as PlayRecord
      }

      const { results, members: next } = closeRoundScoring({
        members,
        plays,
        lowerIsBetter: GAME_MAP[round.gameId].direction === 'lower',
        gameId: round.gameId,
      })

      tx.update(roundRef(groupId, round.id), {
        status: 'closed',
        closedAt: Date.now(),
        results,
      })
      for (const m of next) tx.set(memberRef(groupId, m.uid), m)

      const seed = (round.seed * 1664525 + 1013904223) >>> 0
      const gameId = nextGameId(round.gameId as GameId, seed)
      const nextRound = firstRound(groupId, gameId, seed, group.settings.timeoutHours)
      nextRound.index = round.index + 1
      tx.set(roundRef(groupId, nextRound.id), nextRound)
      tx.update(groupRef(groupId), { currentRoundId: nextRound.id })
    })
  },

  async newSeason(groupId, uid) {
    const { db } = getFirebase()
    const g = await getDoc(groupRef(groupId))
    if (!g.exists() || (g.data() as Group).createdBy !== uid) {
      throw new Error('Solo el creador puede resetear la temporada')
    }
    const members = await getDocs(collection(db, 'groups', groupId, 'members'))
    const batch = writeBatch(db)
    batch.update(groupRef(groupId), { seasonNumber: (g.data() as Group).seasonNumber + 1 })
    for (const d of members.docs) {
      batch.set(memberRef(groupId, d.id), resetSeasonMember(d.data() as Member))
    }
    await batch.commit()
  },

  async peekGroup(groupId) {
    const snap = await getDoc(groupRef(groupId))
    return snap.exists() ? (snap.data() as Group) : null
  },
}
