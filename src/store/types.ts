import type { Career } from '../lib/career'
import type { AvatarLook, ChatMessage, GameId, Group, GroupSnapshot, PlayRecord, UserProfile } from '../types'

export type SessionUser = {
  uid: string
  displayName: string | null
  photoURL: string | null
  email: string | null
  provider: 'google' | 'apple' | 'local'
}

export type AuthAPI = {
  subscribe(cb: (user: SessionUser | null) => void): () => void
  signInGoogle(): Promise<void>
  signInApple(): Promise<void>
  signInLocal(name: string): Promise<void>
  signOut(): Promise<void>
}

export type MyGroup = {
  id: string
  name: string
  code: string
  seasonPoints?: number
  wins?: number
  roundsPlayed?: number
  playStreak?: number
  liveBest?: number | null
  rank: number
  gameId?: GameId
  members: { uid: string; name: string; photo: string | null; picture?: string | null; look: AvatarLook | null }[]
}

export type StoreAPI = {
  ensureUser(session: SessionUser, nickname?: string): Promise<UserProfile>
  watchProfile(uid: string, cb: (profile: UserProfile | null) => void): () => void
  updateNickname(uid: string, name: string): Promise<void>
  updateAvatar(uid: string, look: AvatarLook): Promise<void>
  updatePhoto(uid: string, url: string | null): Promise<void>
  watchMyGroups(uid: string, cb: (groups: MyGroup[]) => void): () => void
  watchCareer(uid: string, cb: (career: Career) => void): () => void
  createGroup(
    uid: string,
    name: string,
    displayName: string,
    photoURL: string | null,
    avatar?: AvatarLook | null,
    changeMinutes?: number,
  ): Promise<string>
  joinGroup(
    uid: string,
    code: string,
    displayName: string,
    photoURL: string | null,
    avatar?: AvatarLook | null,
  ): Promise<string>
  watchGroup(groupId: string, cb: (snap: GroupSnapshot | null, live?: boolean) => void): () => void
  watchMessages(groupId: string, cb: (messages: ChatMessage[]) => void): () => void
  sendMessage(groupId: string, uid: string, name: string, text: string): Promise<void>
  submitPlay(
    groupId: string,
    roundId: string,
    uid: string,
    kind: 'practice' | 'official',
    score: number,
  ): Promise<PlayRecord>
  keepTurn(groupId: string, roundId: string, uid: string): Promise<void>
  closeAndAdvance(groupId: string): Promise<void>
  voteAdvance(groupId: string, uid: string): Promise<void>
  newSeason(groupId: string, uid: string): Promise<void>
  peekGroup(groupId: string): Promise<Group | null>
}

export function defaultSettings() {
  return { officialAttempts: 2, practiceEnabled: true, timeoutHours: 24 }
}

export function firstRound(groupId: string, gameId: GameId, seed: number, timeoutHours: number) {
  const now = Date.now()
  return {
    id: `r_${seed.toString(16)}`,
    groupId,
    gameId,
    seed,
    index: 1,
    status: 'active' as const,
    startedAt: now,
    timeoutAt: now + timeoutHours * 3600 * 1000,
    closedAt: null,
    results: null,
  }
}
