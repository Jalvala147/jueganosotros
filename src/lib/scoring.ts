import type { Member, PlayRecord, RoundResult } from '../types'

export function shouldAutoClose(memberCount: number, finishedCount: number): boolean {
  return memberCount >= 2 && finishedCount >= memberCount && memberCount > 0
}

export const PLACEMENT_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] as const
export const PARTICIPATION_POINTS = 2
export const STARTING_ELO = 1000
export const ELO_K = 24

export function placementPoints(rank: number): number {
  if (rank <= 0) return 0
  if (rank <= PLACEMENT_TABLE.length) return PLACEMENT_TABLE[rank - 1]!
  return 1
}

export function formPoints(lastFive: number[]): number {
  return lastFive.slice(-5).reduce((sum, n) => sum + n, 0)
}

export function compareMembers(a: Member, b: Member): number {
  if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints
  if (b.wins !== a.wins) return b.wins - a.wins
  const formA = formPoints(a.lastFivePoints)
  const formB = formPoints(b.lastFivePoints)
  if (formB !== formA) return formB - formA
  const avgA = a.roundsPlayed ? a.seasonPoints / a.roundsPlayed : 0
  const avgB = b.roundsPlayed ? b.seasonPoints / b.roundsPlayed : 0
  if (avgB !== avgA) return avgB - avgA
  return a.displayName.localeCompare(b.displayName, 'es')
}

export function rankByScore(
  scores: { uid: string; best: number }[],
  lowerIsBetter: boolean,
): { uid: string; best: number; rank: number }[] {
  const sorted = [...scores].sort((a, b) =>
    lowerIsBetter ? a.best - b.best : b.best - a.best,
  )
  const out: { uid: string; best: number; rank: number }[] = []
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!
    const prev = sorted[i - 1]
    const rank =
      prev && prev.best === current.best ? out[i - 1]!.rank : i + 1
    out.push({ uid: current.uid, best: current.best, rank })
  }
  return out
}

export function updateElo(
  ratings: Record<string, number>,
  ranks: Record<string, number>,
  k = ELO_K,
): Record<string, number> {
  const uids = Object.keys(ranks)
  const next = { ...ratings }
  if (uids.length < 2) return next

  for (const a of uids) {
    let delta = 0
    for (const b of uids) {
      if (a === b) continue
      const ra = ratings[a] ?? STARTING_ELO
      const rb = ratings[b] ?? STARTING_ELO
      const expected = 1 / (1 + 10 ** ((rb - ra) / 400))
      let actual = 0.5
      if (ranks[a]! < ranks[b]!) actual = 1
      else if (ranks[a]! > ranks[b]!) actual = 0
      delta += k * (actual - expected)
    }
    next[a] = Math.round((ratings[a] ?? STARTING_ELO) + delta / (uids.length - 1))
  }
  return next
}

export function streakBonus(winStreak: number, playStreak: number): number {
  let bonus = 0
  if (playStreak > 0 && playStreak % 5 === 0) bonus += 1
  if (winStreak === 3 || winStreak === 5 || winStreak === 7 || winStreak === 10) {
    bonus += 2
  }
  return bonus
}

type CloseInput = {
  members: Member[]
  plays: Record<string, PlayRecord>
  lowerIsBetter: boolean
  gameId: string
}

export function closeRoundScoring({
  members,
  plays,
  lowerIsBetter,
  gameId,
}: CloseInput): { results: RoundResult[]; members: Member[] } {
  const played = members.filter((m) => plays[m.uid]?.finished && plays[m.uid]?.best != null)
  const absent = members.filter((m) => !played.some((p) => p.uid === m.uid))
  const ranked = rankByScore(
    played.map((m) => ({ uid: m.uid, best: plays[m.uid]!.best! })),
    lowerIsBetter,
  )
  const lastRank = members.length
  const ranks: Record<string, number> = {}
  for (const row of ranked) ranks[row.uid] = row.rank
  for (const m of absent) ranks[m.uid] = lastRank

  const ratings: Record<string, number> = {}
  for (const m of members) ratings[m.uid] = m.elo
  const nextElo = updateElo(ratings, ranks)

  const results: RoundResult[] = []
  const nextMembers = members.map((member) => {
    const play = plays[member.uid]
    const rank = ranks[member.uid] ?? lastRank
    const didPlay = Boolean(play?.finished && play.best != null)
    const place = didPlay ? placementPoints(rank) : 0
    const participation = didPlay ? PARTICIPATION_POINTS : 0
    const won = didPlay && rank === 1
    const podium = didPlay && rank <= 3
    const notLast = didPlay && rank < members.length
    const playStreak = didPlay ? member.playStreak + 1 : 0
    const winStreak = won ? member.winStreak + 1 : 0
    const podiumStreak = podium ? member.podiumStreak + 1 : 0
    const notLastStreak = notLast ? member.notLastStreak + 1 : 0
    const clutch = Boolean(won && play?.usedLastAttempt && (play.official.length ?? 0) >= 2)
    const prevBest = member.gameBest[gameId]
    const record = Boolean(
      didPlay &&
        play?.best != null &&
        (prevBest == null ||
          (lowerIsBetter ? play.best < prevBest : play.best > prevBest)),
    )
    const bonus =
      (didPlay ? streakBonus(winStreak, playStreak) : 0) +
      (clutch ? 1 : 0) +
      (record ? 1 : 0)
    const gained = place + participation + bonus
    const eloDelta = (nextElo[member.uid] ?? member.elo) - member.elo

    results.push({
      uid: member.uid,
      best: play?.best ?? (lowerIsBetter ? 999999 : 0),
      rank,
      placementPoints: place + participation,
      bonus,
      eloDelta,
      clutch,
      record,
    })

    const h2h = { ...member.h2h }
    if (didPlay) {
      for (const other of members) {
        if (other.uid === member.uid) continue
        const otherRank = ranks[other.uid] ?? lastRank
        const cell = h2h[other.uid] ?? { wins: 0, losses: 0 }
        if (rank < otherRank) h2h[other.uid] = { ...cell, wins: cell.wins + 1 }
        else if (rank > otherRank) h2h[other.uid] = { ...cell, losses: cell.losses + 1 }
      }
    }

    const gameBest = { ...member.gameBest }
    if (didPlay && play?.best != null && record) gameBest[gameId] = play.best
    const gameWins = { ...member.gameWins }
    if (won) gameWins[gameId] = (gameWins[gameId] ?? 0) + 1

    return {
      ...member,
      seasonPoints: member.seasonPoints + gained,
      wins: member.wins + (won ? 1 : 0),
      elo: nextElo[member.uid] ?? member.elo,
      playStreak,
      winStreak,
      podiumStreak,
      notLastStreak,
      lastFivePoints: [...member.lastFivePoints, gained].slice(-5),
      gameBest,
      gameWins,
      h2h,
      roundsPlayed: member.roundsPlayed + (didPlay ? 1 : 0),
    }
  })

  results.sort((a, b) => a.rank - b.rank || b.placementPoints - a.placementPoints)
  nextMembers.sort(compareMembers)
  return { results, members: nextMembers }
}

export function emptyMember(
  uid: string,
  displayName: string,
  photoURL: string | null,
  avatar: Member['avatar'] = null,
): Member {
  return {
    uid,
    displayName,
    photoURL,
    avatar,
    joinedAt: Date.now(),
    seasonPoints: 0,
    wins: 0,
    elo: STARTING_ELO,
    playStreak: 0,
    winStreak: 0,
    podiumStreak: 0,
    notLastStreak: 0,
    lastFivePoints: [],
    gameBest: {},
    gameWins: {},
    h2h: {},
    roundsPlayed: 0,
  }
}

export function resetSeasonMember(member: Member): Member {
  return {
    ...member,
    seasonPoints: 0,
    wins: 0,
    playStreak: 0,
    winStreak: 0,
    podiumStreak: 0,
    notLastStreak: 0,
    lastFivePoints: [],
    roundsPlayed: 0,
  }
}
