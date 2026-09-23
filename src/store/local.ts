import { makeGroupCode, normalizeCode } from '../lib/codes'
import { makeId } from '../lib/ids'
import { nextGameId } from '../games/catalog'
import { GAME_MAP } from '../games/catalog'
import { buildCareer } from '../lib/career'
import { closeRoundScoring, compareMembers, emptyMember, resetSeasonMember, shouldAutoClose } from '../lib/scoring'
import type { AvatarLook, Group, GroupSnapshot, Member, PlayRecord, Round, UserProfile } from '../types'
import { defaultSettings, firstRound, type AuthAPI, type MyGroup, type SessionUser, type StoreAPI } from './types'

const DATA_KEY = 'jn.v1.data'
const SESSION_KEY = 'jn.v1.session'

type DB = {
  users: Record<string, UserProfile>
  groups: Record<string, Group>
  members: Record<string, Record<string, Member>>
  rounds: Record<string, Record<string, Round>>
  plays: Record<string, Record<string, Record<string, PlayRecord>>>
  codes: Record<string, string>
}

const listeners = new Set<() => void>()

function emptyDb(): DB {
  return { users: {}, groups: {}, members: {}, rounds: {}, plays: {}, codes: {} }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    return raw ? (JSON.parse(raw) as DB) : emptyDb()
  } catch {
    return emptyDb()
  }
}

function save(db: DB) {
  localStorage.setItem(DATA_KEY, JSON.stringify(db))
  for (const l of listeners) l()
}

function mutate(fn: (db: DB) => void) {
  const db = load()
  fn(db)
  save(db)
}

function onChange(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const localAuth: AuthAPI = {
  subscribe(cb) {
    const emit = () => {
      const raw = sessionStorage.getItem(SESSION_KEY)
      cb(raw ? (JSON.parse(raw) as SessionUser) : null)
    }
    emit()
    window.addEventListener('storage', emit)
    return () => window.removeEventListener('storage', emit)
  },
  async signInGoogle() {
    throw new Error('Activa Firebase para entrar con Google')
  },
  async signInApple() {
    throw new Error('Activa Firebase para entrar con Apple')
  },
  async signInLocal(name: string) {
    const clean = name.trim().slice(0, 20)
    if (clean.length < 2) throw new Error('Pon un apodo de al menos 2 letras')
    const uid = `local_${clean.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '_')}`
    const user: SessionUser = {
      uid,
      displayName: clean,
      photoURL: null,
      email: null,
      provider: 'local',
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    window.dispatchEvent(new Event('storage'))
  },
  async signOut() {
    sessionStorage.removeItem(SESSION_KEY)
    window.dispatchEvent(new Event('storage'))
  },
}

export const localStore: StoreAPI = {
  async ensureUser(session, nickname) {
    let profile: UserProfile | null = null
    mutate((db) => {
      const current = db.users[session.uid]
      profile = current ?? {
        uid: session.uid,
        displayName: nickname || session.displayName || 'Jugador',
        photoURL: session.photoURL,
        avatar: null,
        email: session.email,
        createdAt: Date.now(),
        groupIds: [],
      }
      if (nickname) profile.displayName = nickname
      db.users[session.uid] = profile
    })
    return profile!
  },

  watchProfile(uid, cb) {
    const emit = () => cb(load().users[uid] ?? null)
    emit()
    return onChange(emit)
  },

  async updateNickname(uid, name) {
    const clean = name.trim().slice(0, 20)
    mutate((db) => {
      if (db.users[uid]) db.users[uid]!.displayName = clean
      for (const gid of db.users[uid]?.groupIds ?? []) {
        if (db.members[gid]?.[uid]) db.members[gid]![uid]!.displayName = clean
      }
    })
  },

  async updateAvatar(uid, look) {
    mutate((db) => {
      if (db.users[uid]) db.users[uid]!.avatar = look
      for (const gid of db.users[uid]?.groupIds ?? []) {
        if (db.members[gid]?.[uid]) db.members[gid]![uid]!.avatar = look
      }
    })
  },

  watchMyGroups(uid, cb) {
    const emit = () => {
      const db = load()
      const groups = (db.users[uid]?.groupIds ?? [])
        .map((id) => db.groups[id])
        .filter(Boolean)
        .map((g) => {
          const members = Object.values(db.members[g!.id] ?? {}).sort(compareMembers)
          const me = members.findIndex((m) => m.uid === uid)
          const round = db.rounds[g!.id]?.[g!.currentRoundId]
          const card: MyGroup = {
            id: g!.id,
            name: g!.name,
            code: g!.code,
            seasonPoints: db.members[g!.id]?.[uid]?.seasonPoints,
            rank: me >= 0 ? me + 1 : members.length,
            gameId: round?.gameId,
            members: members.slice(0, 8).map((m) => ({
              uid: m.uid,
              name: m.displayName,
              photo: m.photoURL,
              look: m.avatar ?? null,
            })),
          }
          return card
        })
      cb(groups)
    }
    emit()
    return onChange(emit)
  },

  watchCareer(uid, cb) {
    const emit = () => {
      const db = load()
      const ids = db.users[uid]?.groupIds ?? []
      const packs = ids
        .map((id) => db.groups[id])
        .filter((g): g is NonNullable<typeof g> => Boolean(g))
        .map((group) => ({
          group,
          members: Object.values(db.members[group.id] ?? {}),
          rounds: Object.values(db.rounds[group.id] ?? {}),
        }))
      cb(buildCareer(uid, packs))
    }
    emit()
    return onChange(emit)
  },

  async createGroup(uid, name, displayName, photoURL, avatar: AvatarLook | null = null) {
    const id = makeId('g')
    const code = makeGroupCode()
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now()) >>> 0
    const gameId = nextGameId(null, seed)
    mutate((db) => {
      if (db.codes[code]) throw new Error('Código repetido, inténtalo otra vez')
      const group: Group = {
        id,
        name: name.trim().slice(0, 32) || 'Mi grupo',
        code,
        createdBy: uid,
        createdAt: Date.now(),
        seasonNumber: 1,
        currentRoundId: `r_${seed.toString(16)}`,
        memberIds: [uid],
        settings: defaultSettings(),
      }
      const round = firstRound(id, gameId, seed, group.settings.timeoutHours)
      db.groups[id] = group
      db.codes[code] = id
      db.members[id] = { [uid]: emptyMember(uid, displayName, photoURL, avatar ?? db.users[uid]?.avatar ?? null) }
      db.rounds[id] = { [round.id]: round }
      db.plays[id] = { [round.id]: {} }
      db.users[uid] ??= {
        uid,
        displayName,
        photoURL,
        avatar: avatar ?? null,
        email: null,
        createdAt: Date.now(),
        groupIds: [],
      }
      if (!db.users[uid]!.groupIds.includes(id)) db.users[uid]!.groupIds.push(id)
    })
    return id
  },

  async joinGroup(uid, code, displayName, photoURL, avatar: AvatarLook | null = null) {
    const normalized = normalizeCode(code)
    let groupId = ''
    mutate((db) => {
      const id = db.codes[normalized]
      if (!id || !db.groups[id]) throw new Error('Ese código no existe')
      groupId = id
      db.members[id] ??= {}
      const look = avatar ?? db.users[uid]?.avatar ?? null
      db.members[id]![uid] ??= emptyMember(uid, displayName, photoURL, look)
      db.users[uid] ??= {
        uid,
        displayName,
        photoURL,
        avatar: look,
        email: null,
        createdAt: Date.now(),
        groupIds: [],
      }
      if (!db.users[uid]!.groupIds.includes(id)) db.users[uid]!.groupIds.push(id)
      if (!db.groups[id]!.memberIds.includes(uid)) db.groups[id]!.memberIds.push(uid)
    })
    return groupId
  },

  watchGroup(groupId, cb) {
    const emit = () => {
      const db = load()
      const group = db.groups[groupId]
      if (!group) {
        cb(null)
        return
      }
      const members = Object.values(db.members[groupId] ?? {})
      const rounds = Object.values(db.rounds[groupId] ?? {}).sort((a, b) => b.index - a.index)
      const round = db.rounds[groupId]?.[group.currentRoundId] ?? rounds[0]
      if (!round) {
        cb(null)
        return
      }
      const snap: GroupSnapshot = {
        group,
        members,
        round,
        plays: db.plays[groupId]?.[round.id] ?? {},
        history: rounds.filter((r) => r.status === 'closed').slice(0, 20),
      }
      cb(snap)
    }
    emit()
    return onChange(emit)
  },

  async submitPlay(groupId, roundId, uid, kind, score) {
    let record: PlayRecord | null = null
    let shouldClose = false
    mutate((db) => {
      const group = db.groups[groupId]
      const round = db.rounds[groupId]?.[roundId]
      if (!group || !round || round.status !== 'active') throw new Error('La ronda ya no está activa')
      db.plays[groupId] ??= {}
      db.plays[groupId]![roundId] ??= {}
      const prev = db.plays[groupId]![roundId]![uid] ?? {
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
        if (!group.settings.practiceEnabled) throw new Error('No hay práctica en este grupo')
        if (prev.practiceScore != null) throw new Error('La práctica ya está usada')
        prev.practiceScore = score
      } else {
        if (prev.official.length >= group.settings.officialAttempts) {
          throw new Error('No te quedan intentos')
        }
        prev.official.push(score)
        const meta = GAME_MAP[round.gameId]
        const best = meta.direction === 'lower'
          ? Math.min(...prev.official)
          : Math.max(...prev.official)
        prev.best = best
        if (prev.official.length >= group.settings.officialAttempts) {
          prev.finished = true
          prev.usedLastAttempt = prev.official[prev.official.length - 1] === best && prev.official.length > 1
        }
      }
      prev.updatedAt = Date.now()
      db.plays[groupId]![roundId]![uid] = prev
      record = prev

      const memberIds = Object.keys(db.members[groupId] ?? {})
      const plays = db.plays[groupId]![roundId]!
      shouldClose = shouldAutoClose(memberIds.length, memberIds.filter((id) => plays[id]?.finished).length)
    })
    if (shouldClose) await localStore.closeAndAdvance(groupId)
    return record!
  },

  async closeAndAdvance(groupId) {
    mutate((db) => {
      const group = db.groups[groupId]
      if (!group) throw new Error('Grupo no encontrado')
      const round = db.rounds[groupId]?.[group.currentRoundId]
      if (!round || round.status === 'closed') return
      const members = Object.values(db.members[groupId] ?? {})
      const plays = db.plays[groupId]?.[round.id] ?? {}
      const { results, members: next } = closeRoundScoring({
        members,
        plays,
        lowerIsBetter: GAME_MAP[round.gameId].direction === 'lower',
        gameId: round.gameId,
      })
      round.status = 'closed'
      round.closedAt = Date.now()
      round.results = results
      db.members[groupId] = Object.fromEntries(next.map((m) => [m.uid, m]))

      const seed = (round.seed * 1664525 + 1013904223) >>> 0
      const gameId = nextGameId(round.gameId, seed)
      const nextRound = firstRound(groupId, gameId, seed, group.settings.timeoutHours)
      nextRound.index = round.index + 1
      db.rounds[groupId]![nextRound.id] = nextRound
      db.plays[groupId]![nextRound.id] = {}
      group.currentRoundId = nextRound.id
    })
  },

  async newSeason(groupId, uid) {
    mutate((db) => {
      const group = db.groups[groupId]
      if (!group || group.createdBy !== uid) throw new Error('Solo el creador puede resetear la temporada')
      group.seasonNumber += 1
      const members = db.members[groupId] ?? {}
      for (const key of Object.keys(members)) {
        members[key] = resetSeasonMember(members[key]!)
      }
    })
  },

  async peekGroup(groupId) {
    return load().groups[groupId] ?? null
  },
}
