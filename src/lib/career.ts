import { GAME_MAP } from '../games/catalog'
import type { GameId, Group, Member, Round } from '../types'

export type CareerMark = {
  gameId: GameId
  score: number
  at: number
  groupId: string
  groupName: string
}

export type CareerRow = {
  name: string
  score: number
  you: boolean
  groupName: string
}

export type Career = {
  roundsPlayed: number
  wins: number
  rivals: number
  playStreak: number
  marks: CareerMark[]
  gameWins: Record<string, number>
  boards: Record<string, CareerRow[]>
}

export function emptyCareer(): Career {
  return {
    roundsPlayed: 0,
    wins: 0,
    rivals: 0,
    playStreak: 0,
    marks: [],
    gameWins: {},
    boards: {},
  }
}

export function betterScore(gameId: string, next: number, current: number): boolean {
  const lower = GAME_MAP[gameId as GameId]?.direction === 'lower'
  return lower ? next < current : next > current
}

export function buildCareer(
  uid: string,
  packs: { group: Group; members: Member[]; rounds: Round[]; openFinished?: boolean }[],
): Career {
  const career = emptyCareer()
  const rivals = new Set<string>()
  const boards: Record<string, CareerRow[]> = {}

  for (const pack of packs) {
    const me = pack.members.find((m) => m.uid === uid)
    if (!me) continue
    career.roundsPlayed += me.roundsPlayed + (pack.openFinished ? 1 : 0)
    career.wins += me.wins
    career.playStreak = Math.max(career.playStreak, me.playStreak)
    for (const [gameId, wins] of Object.entries(me.gameWins)) {
      career.gameWins[gameId] = (career.gameWins[gameId] ?? 0) + wins
    }
    for (const member of pack.members) {
      if (member.uid !== uid) rivals.add(member.uid)
      for (const [gameId, score] of Object.entries(member.gameBest)) {
        boards[gameId] ??= []
        boards[gameId].push({
          name: member.displayName,
          score,
          you: member.uid === uid,
          groupName: pack.group.name,
        })
      }
    }
    for (const round of pack.rounds) {
      if (round.status !== 'closed' || !round.results) continue
      const mine = round.results.find((r) => r.uid === uid)
      if (!mine || mine.best == null) continue
      career.marks.push({
        gameId: round.gameId,
        score: mine.best,
        at: round.closedAt ?? round.startedAt,
        groupId: pack.group.id,
        groupName: pack.group.name,
      })
    }
  }

  career.rivals = rivals.size
  career.marks.sort((a, b) => b.at - a.at)
  for (const [gameId, rows] of Object.entries(boards)) {
    rows.sort((a, b) => {
      if (a.score === b.score) return a.name.localeCompare(b.name)
      return betterScore(gameId, a.score, b.score) ? -1 : 1
    })
  }
  career.boards = boards
  return career
}

export function bestIn(marks: CareerMark[], gameId: string): number | null {
  const mine = marks.filter((m) => m.gameId === gameId)
  if (!mine.length) return null
  return mine.reduce((best, mark) => (betterScore(gameId, mark.score, best) ? mark.score : best), mine[0]!.score)
}
