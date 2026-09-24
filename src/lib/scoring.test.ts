import { describe, expect, it } from 'vitest'
import {
  closeRoundScoring,
  emptyMember,
  formPoints,
  placementPoints,
  rankByScore,
  changeIsDue,
  majorityReached,
  shouldAutoClose,
  updateElo,
} from './scoring'

describe('shouldAutoClose', () => {
  it('no cierra con un solo jugador', () => {
    expect(shouldAutoClose(1, 1)).toBe(false)
  })
  it('cierra cuando todos han jugado siendo 2 o más', () => {
    expect(shouldAutoClose(2, 2)).toBe(true)
    expect(shouldAutoClose(3, 2)).toBe(false)
  })
})

describe('avance de ronda', () => {
  it('pide mayoría estricta', () => {
    expect(majorityReached(1, 2)).toBe(false)
    expect(majorityReached(2, 2)).toBe(true)
    expect(majorityReached(2, 3)).toBe(true)
  })
  it('cambia solo si ya pasó la hora y la ronda empezó antes', () => {
    const slot = new Date('2026-09-23T21:00:00')
    const before = slot.getTime() - 60_000
    const after = slot.getTime() + 60_000
    expect(changeIsDue(before, 21 * 60, after)).toBe(true)
    expect(changeIsDue(after, 21 * 60, after + 1000)).toBe(false)
  })
})

describe('placementPoints', () => {
  it('usa la tabla F1', () => {
    expect(placementPoints(1)).toBe(25)
    expect(placementPoints(2)).toBe(18)
    expect(placementPoints(10)).toBe(1)
    expect(placementPoints(11)).toBe(1)
  })
})

describe('rankByScore', () => {
  it('asigna empates 1,1,3', () => {
    const ranked = rankByScore(
      [
        { uid: 'a', best: 10 },
        { uid: 'b', best: 10 },
        { uid: 'c', best: 4 },
      ],
      false,
    )
    expect(ranked.map((r) => [r.uid, r.rank])).toEqual([
      ['a', 1],
      ['b', 1],
      ['c', 3],
    ])
  })

  it('en empate gana quien usó menos intentos y, si sigue igual, quien llegó después', () => {
    const ranked = rankByScore(
      [
        { uid: 'tarde', best: 10, attempts: 2, at: 300 },
        { uid: 'pocos', best: 10, attempts: 1, at: 100 },
        { uid: 'despues', best: 10, attempts: 2, at: 400 },
      ],
      false,
    )
    expect(ranked.map((r) => r.uid)).toEqual(['pocos', 'despues', 'tarde'])
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('invierte si menor es mejor', () => {
    const ranked = rankByScore(
      [
        { uid: 'a', best: 320 },
        { uid: 'b', best: 210 },
      ],
      true,
    )
    expect(ranked[0]).toMatchObject({ uid: 'b', rank: 1 })
  })
})

describe('updateElo', () => {
  it('sube al ganador y baja al perdedor', () => {
    const next = updateElo({ a: 1000, b: 1000 }, { a: 1, b: 2 })
    expect(next.a).toBeGreaterThan(1000)
    expect(next.b).toBeLessThan(1000)
  })
})

describe('closeRoundScoring', () => {
  it('paga puesto, participación y rompe racha si no juegas', () => {
    const members = [
      { ...emptyMember('a', 'Ana', null), playStreak: 4, winStreak: 2 },
      emptyMember('b', 'Beto', null),
      emptyMember('c', 'Cata', null),
    ]
    const { results, members: next } = closeRoundScoring({
      members,
      lowerIsBetter: false,
      gameId: 'flappy',
      plays: {
        a: {
          uid: 'a',
          practiceScore: 1,
          official: [12, 20],
          best: 20,
          finished: true,
          usedLastAttempt: true,
          updatedAt: 1,
        },
        b: {
          uid: 'b',
          practiceScore: null,
          official: [9],
          best: 9,
          finished: true,
          usedLastAttempt: false,
          updatedAt: 1,
        },
      },
    })
    const ana = next.find((m) => m.uid === 'a')!
    const cata = next.find((m) => m.uid === 'c')!
    expect(results[0]?.uid).toBe('a')
    expect(ana.seasonPoints).toBeGreaterThan(25)
    expect(ana.playStreak).toBe(5)
    expect(ana.wins).toBe(1)
    expect(cata.playStreak).toBe(0)
    expect(cata.seasonPoints).toBe(0)
    expect(cata.elo).toBe(1000)
    expect(ana.elo).toBeGreaterThan(1000)
    expect(formPoints(ana.lastFivePoints)).toBe(ana.seasonPoints)
  })
})
