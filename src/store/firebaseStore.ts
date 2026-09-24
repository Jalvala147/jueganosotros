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
import { makeId } from '../lib/ids'
import { findGame, nextGameId, nextInOrder, startOrder } from '../games/catalog'
import { getFirebase } from '../lib/firebase'
import { buildCareer } from '../lib/career'
import { closeRoundScoring, compareMembers, emptyMember, majorityReached, resetSeasonMember } from '../lib/scoring'
import type { AvatarLook, ChatMessage, GameId, Group, GroupSnapshot, Member, PlayRecord, Round, UserProfile } from '../types'
import { defaultSettings, firstRound, type AuthAPI, type MyGroup, type StoreAPI } from './types'

function authCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : ''
}

export function authErrorMessage(error: unknown) {
  const code = authCode(error)
  if (code === 'auth/unauthorized-domain') {
    return 'Este dominio no está autorizado en Firebase. Agrégalo en Authentication → Settings → Authorized domains.'
  }
  if (code === 'auth/popup-blocked') {
    return 'El iPhone bloqueó la ventana de Google. Ábrelo en Safari, no dentro de WhatsApp o Instagram.'
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Se cerró la ventana de Google antes de entrar.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Activa Google en Firebase → Authentication → Sign-in method.'
  }
  if (code === 'auth/web-storage-unsupported') {
    return 'Safari está bloqueando el guardado. Sal de la navegación privada e inténtalo otra vez.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'No se pudo entrar'
}

async function signInWith(provider: GoogleAuthProvider | OAuthProvider) {
  const { auth } = getFirebase()
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    const code = authCode(error)
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
      return
    }
    throw new Error(authErrorMessage(error))
  }
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
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWith(provider)
  },
  async signInApple() {
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    await signInWith(provider)
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
      avatar: null,
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

  async updateAvatar(uid, look) {
    const { db } = getFirebase()
    const userSnap = await getDoc(userRef(uid))
    const groupIds = (userSnap.data() as UserProfile | undefined)?.groupIds ?? []
    const batch = writeBatch(db)
    batch.update(userRef(uid), { avatar: look })
    for (const gid of groupIds) batch.update(memberRef(gid, uid), { avatar: look })
    await batch.commit()
  },

  async updatePhoto(uid, url) {
    const { db } = getFirebase()
    const userSnap = await getDoc(userRef(uid))
    const groupIds = (userSnap.data() as UserProfile | undefined)?.groupIds ?? []
    const batch = writeBatch(db)
    batch.update(userRef(uid), { customPhotoURL: url })
    for (const gid of groupIds) batch.update(memberRef(gid, uid), { customPhotoURL: url })
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
            const membersSnap = await getDocs(collection(getFirebase().db, 'groups', id, 'members'))
            const members = membersSnap.docs.map((d) => d.data() as Member).sort(compareMembers)
            const me = members.findIndex((member) => member.uid === uid)
            const mine = m.data() as Member | undefined
            const roundSnap = data.currentRoundId
              ? await getDoc(roundRef(id, data.currentRoundId))
              : null
            const round = roundSnap?.data() as Round | undefined
            const liveSnap = round?.status === 'active' ? await getDoc(playRef(id, round.id, uid)) : null
            const live = liveSnap?.data() as PlayRecord | undefined
            const card: MyGroup = {
              id: data.id,
              name: data.name,
              code: data.code,
              seasonPoints: mine?.seasonPoints,
              wins: mine?.wins,
              roundsPlayed: (mine?.roundsPlayed ?? 0) + (live && (live.finished || live.official.length > 0) ? 1 : 0),
              liveBest: live?.best ?? null,
              playStreak: mine?.playStreak,
              rank: me >= 0 ? me + 1 : members.length,
              gameId: round?.gameId,
              members: members.slice(0, 8).map((member) => ({
                uid: member.uid,
                name: member.displayName,
                photo: member.photoURL,
                picture: member.customPhotoURL ?? null,
                look: member.avatar ?? null,
              })),
            }
            return card
          }),
        )
      ).filter(Boolean) as MyGroup[]
      cb(groups)
    })
  },

  watchCareer(uid, cb) {
    return onSnapshot(userRef(uid), async (snap) => {
      const ids = (snap.data() as UserProfile | undefined)?.groupIds ?? []
      const packs = (
        await Promise.all(
          ids.map(async (id) => {
            const g = await getDoc(groupRef(id))
            if (!g.exists()) return null
            const group = g.data() as Group
            const [membersSnap, roundsSnap, roundSnap] = await Promise.all([
              getDocs(collection(getFirebase().db, 'groups', id, 'members')),
              getDocs(collection(getFirebase().db, 'groups', id, 'rounds')),
              group.currentRoundId ? getDoc(roundRef(id, group.currentRoundId)) : Promise.resolve(null),
            ])
            const round = roundSnap?.data() as Round | undefined
            const liveSnap = round?.status === 'active' ? await getDoc(playRef(id, round.id, uid)) : null
            const live = liveSnap?.data() as PlayRecord | undefined
            return {
              group,
              members: membersSnap.docs.map((d) => d.data() as Member),
              rounds: roundsSnap.docs.map((d) => d.data() as Round),
              openFinished: Boolean(live && (live.finished || live.official.length > 0)),
            }
          }),
        )
      ).filter((pack): pack is NonNullable<typeof pack> => Boolean(pack))
      cb(buildCareer(uid, packs))
    })
  },

  async createGroup(uid, name, displayName, photoURL, avatar: AvatarLook | null = null, changeMinutes?: number) {
    const { db } = getFirebase()
    const id = doc(collection(db, 'groups')).id
    const code = makeGroupCode()
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now()) >>> 0
    const settings = { ...defaultSettings(), changeMinutes }
    const round = firstRound(id, nextGameId(null, seed), seed, settings.timeoutHours)
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
      const busy: string[] = []
      for (const gid of profile.groupIds ?? []) {
        const other = await tx.get(groupRef(gid))
        if (!other.exists()) continue
        const currentId = (other.data() as Group).currentRoundId
        const current = await tx.get(roundRef(gid, currentId))
        const playing = (current.data() as Round | undefined)?.gameId
        if (playing) busy.push(playing)
      }
      const order = startOrder(seed, busy)
      group.gameOrder = order
      round.gameId = order[0]!
      tx.set(codeRef(code), { groupId: id })
      tx.set(groupRef(id), group)
      const member = emptyMember(uid, displayName, photoURL, avatar ?? profile?.avatar ?? null)
      member.customPhotoURL = profile?.customPhotoURL ?? null
      tx.set(memberRef(id, uid), member)
      tx.set(roundRef(id, round.id), round)
      tx.set(userRef(uid), { groupIds: [...(profile.groupIds ?? []), id] }, { merge: true })
    })
    return id
  },

  async joinGroup(uid, code, displayName, photoURL, avatar: AvatarLook | null = null) {
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
        const member = emptyMember(uid, displayName, photoURL, avatar ?? profile?.avatar ?? null)
        member.customPhotoURL = profile?.customPhotoURL ?? null
        tx.set(memberRef(groupId, uid), member)
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
    let gotGroup = false
    let gotMembers = false
    let gotRounds = false
    let gotPlays = false
    let playRound = ''

    const emit = () => {
      if (!gotGroup || !gotMembers || !gotRounds || !gotPlays) return
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
      gotPlays = false
      plays = {}
      unsubPlays = onSnapshot(
        collection(getFirebase().db, 'groups', groupId, 'rounds', roundId, 'plays'),
        (snap) => {
          plays = {}
          for (const d of snap.docs) plays[d.id] = d.data() as PlayRecord
          gotPlays = true
          emit()
        },
      )
    }

    const unsubGroup = onSnapshot(groupRef(groupId), (snap) => {
      gotGroup = true
      group = snap.exists() ? (snap.data() as Group) : null
      if (group && group.currentRoundId !== playRound) {
        playRound = group.currentRoundId
        attachPlays(group.currentRoundId)
      } else if (!group) gotPlays = true
      emit()
    })
    const unsubMembers = onSnapshot(collection(getFirebase().db, 'groups', groupId, 'members'), (snap) => {
      gotMembers = true
      members = snap.docs.map((d) => d.data() as Member)
      emit()
    })
    const unsubRounds = onSnapshot(collection(getFirebase().db, 'groups', groupId, 'rounds'), (snap) => {
      gotRounds = true
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

  watchMessages(groupId, cb) {
    return onSnapshot(groupRef(groupId), (snap) => {
      const chat = (snap.data() as { chat?: ChatMessage[] } | undefined)?.chat ?? []
      cb([...chat].sort((a, b) => a.createdAt - b.createdAt))
    })
  },

  async sendMessage(groupId, uid, name, text) {
    const clean = text.trim().slice(0, 240)
    if (!clean) throw new Error('Escribe un mensaje')
    const { db } = getFirebase()
    const message: ChatMessage = {
      id: makeId('m'),
      uid,
      name: name.trim().slice(0, 24) || 'Jugador',
      text: clean,
      createdAt: Date.now(),
    }
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(groupRef(groupId))
      if (!snap.exists()) throw new Error('No encontré la liga')
      const chat = ((snap.data() as { chat?: ChatMessage[] }).chat ?? []).slice(-79)
      tx.update(groupRef(groupId), { chat: [...chat, message] })
    })
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
        const meta = findGame(round.gameId)
        prev.best = meta?.direction === 'lower' ? Math.min(...prev.official) : Math.max(...prev.official)
        if (prev.official.length >= group.settings.officialAttempts) {
          prev.finished = true
          prev.usedLastAttempt = prev.official[prev.official.length - 1] === prev.best && prev.official.length > 1
        }
      }
      prev.updatedAt = Date.now()
      tx.set(playRef(groupId, roundId, uid), prev)
      return prev
    })
    return record
  },

  async voteAdvance(groupId, uid) {
    const { db } = getFirebase()
    let go = false
    await runTransaction(db, async (tx) => {
      const gSnap = await tx.get(groupRef(groupId))
      if (!gSnap.exists()) throw new Error('Grupo no encontrado')
      const group = gSnap.data() as Group
      const rSnap = await tx.get(roundRef(groupId, group.currentRoundId))
      if (!rSnap.exists()) throw new Error('La ronda ya no está activa')
      const round = rSnap.data() as Round
      if (round.status !== 'active') throw new Error('La ronda ya no está activa')
      const memberIds = group.memberIds ?? []
      for (const memberId of memberIds) {
        const play = await tx.get(playRef(groupId, round.id, memberId))
        if (!play.exists() || !(play.data() as PlayRecord).finished) {
          throw new Error('Faltan jugadores por terminar sus dos turnos')
        }
      }
      const votes = new Set(round.advanceVotes ?? [])
      votes.add(uid)
      tx.update(roundRef(groupId, round.id), { advanceVotes: [...votes] })
      go = majorityReached(votes.size, memberIds.length)
    })
    if (go) await firebaseStore.closeAndAdvance(groupId)
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
        lowerIsBetter: findGame(round.gameId)?.direction === 'lower',
        gameId: round.gameId,
      })

      tx.update(roundRef(groupId, round.id), {
        status: 'closed',
        closedAt: Date.now(),
        results,
      })
      for (const m of next) tx.set(memberRef(groupId, m.uid), m)

      const seed = (round.seed * 1664525 + 1013904223) >>> 0
      const gameId = group.gameOrder?.length
        ? nextInOrder(group.gameOrder, round.gameId as GameId)
        : nextGameId(round.gameId as GameId, seed)
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
      throw new Error('Solo quien creó el grupo puede reiniciar la temporada')
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
