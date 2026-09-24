import type { AvatarLook } from './lib/avatar'

export type { AvatarLook }

export type GameId =
  | 'green-tap'
  | 'reaction'
  | 'stop-bar'
  | 'whack'
  | 'simon'
  | 'flappy'
  | 'snake'
  | 'stack'
  | 'crossy'
  | 'color-switch'
  | 'knives'
  | 'darts'
  | 'penalty'
  | 'piano'
  | 'puzzle-2048'
  | 'memory'
  | 'hanoi'
  | 'lane-race'

export type ScoreDirection = 'higher' | 'lower'

export type RoundStatus = 'active' | 'closed'

export type UserProfile = {
  uid: string
  displayName: string
  photoURL: string | null
  customPhotoURL?: string | null
  avatar: AvatarLook | null
  email: string | null
  createdAt: number
  groupIds: string[]
  sentAlerts?: Record<string, boolean>
}

export type GroupSettings = {
  officialAttempts: number
  practiceEnabled: boolean
  timeoutHours: number
  changeMinutes?: number
}

export type Group = {
  id: string
  name: string
  code: string
  createdBy: string
  createdAt: number
  seasonNumber: number
  currentRoundId: string
  memberIds: string[]
  settings: GroupSettings
  gameOrder?: GameId[]
}

export type HeadToHead = {
  wins: number
  losses: number
}

export type Member = {
  uid: string
  displayName: string
  photoURL: string | null
  customPhotoURL?: string | null
  avatar: AvatarLook | null
  joinedAt: number
  seasonPoints: number
  wins: number
  elo: number
  playStreak: number
  winStreak: number
  podiumStreak: number
  notLastStreak: number
  lastFivePoints: number[]
  gameBest: Record<string, number>
  gameWins: Record<string, number>
  h2h: Record<string, HeadToHead>
  roundsPlayed: number
}

export type PlayRecord = {
  uid: string
  practiceScore: number | null
  official: number[]
  best: number | null
  finished: boolean
  usedLastAttempt: boolean
  updatedAt: number
}

export type RoundResult = {
  uid: string
  best: number
  rank: number
  placementPoints: number
  bonus: number
  eloDelta: number
  clutch: boolean
  record: boolean
}

export type Round = {
  id: string
  groupId: string
  gameId: GameId
  seed: number
  index: number
  status: RoundStatus
  startedAt: number
  timeoutAt: number
  closedAt: number | null
  results: RoundResult[] | null
  advanceVotes?: string[]
}

export type ChatMessage = {
  id: string
  uid: string
  name: string
  text: string
  createdAt: number
}

export type GroupSnapshot = {
  group: Group
  members: Member[]
  round: Round
  plays: Record<string, PlayRecord>
  history: Round[]
}

export type GameMeta = {
  id: GameId
  name: string
  blurb: string
  category: string
  accent: string
  emoji: string
  direction: ScoreDirection
  hint: string
  guide: string
}
