import { describe, expect, it } from 'vitest'
import { bestIn, buildCareer } from './career'
import type { Group, Member, Round } from '../types'

function member(uid: string, extra: Partial<Member> = {}): Member {
  return {
    uid,
    displayName: uid,
    photoURL: null,
    avatar: null,
    joinedAt: 1,
    seasonPoints: 0,
    wins: 0,
    elo: 1000,
    playStreak: 0,
    winStreak: 0,
    podiumStreak: 0,
    notLastStreak: 0,
    lastFivePoints: [],
    gameBest: {},
    gameWins: {},
    h2h: {},
    roundsPlayed: 0,
    ...extra,
  }
}

const group = { id: 'g', name: 'Liga', code: 'ABCDEF' } as Group

describe('buildCareer', () => {
  it('sums rounds, rivals and keeps the longer streak', () => {
    const career = buildCareer('ana', [
      {
        group,
        members: [
          member('ana', { roundsPlayed: 3, wins: 1, playStreak: 2, gameWins: { flappy: 1 }, gameBest: { flappy: 8 } }),
          member('beto', { gameBest: { flappy: 4 } }),
        ],
        rounds: [
          {
            id: 'r',
            groupId: 'g',
            gameId: 'flappy',
            seed: 1,
            index: 1,
            status: 'closed',
            startedAt: 10,
            timeoutAt: 20,
            closedAt: 30,
            results: [{ uid: 'ana', best: 8, rank: 1, placementPoints: 25, bonus: 0, eloDelta: 0, clutch: false, record: false }],
          } as Round,
        ],
      },
    ])
    expect(career.roundsPlayed).toBe(3)
    expect(career.wins).toBe(1)
    expect(career.rivals).toBe(1)
    expect(career.playStreak).toBe(2)
    expect(career.marks[0]?.score).toBe(8)
    expect(career.boards.flappy?.[0]?.name).toBe('ana')
    expect(bestIn(career.marks, 'flappy')).toBe(8)
  })
})
