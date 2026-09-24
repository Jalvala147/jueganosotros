import { describe, expect, it } from 'vitest'
import { GAMES, leagueOrder, nextGameId, nextInOrder, startOrder } from './catalog'

describe('catalogo', () => {
  it('tiene 18 juegos distintos', () => {
    expect(GAMES).toHaveLength(18)
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(18)
  })

  it('cada liga mezcla el orden y no abre con el juego de otra', () => {
    const a = leagueOrder(1)
    const b = leagueOrder(2)
    expect(new Set(a).size).toBe(18)
    expect(a.join()).not.toBe(b.join())
    const opened = startOrder(2, [b[0]!])
    expect(opened[0]).not.toBe(b[0])
    expect(nextInOrder(opened, opened[0]!)).toBe(opened[1])
    expect(nextInOrder(opened, opened.at(-1)!)).toBe(opened[0])
  })

  it('nunca repite el juego anterior', () => {
    for (const game of GAMES) {
      for (let seed = 0; seed < 40; seed++) {
        expect(nextGameId(game.id, seed)).not.toBe(game.id)
      }
    }
  })
})
