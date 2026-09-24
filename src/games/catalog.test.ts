import { describe, expect, it } from 'vitest'
import { GAMES, nextGameId } from './catalog'

describe('catalogo', () => {
  it('tiene 18 juegos distintos', () => {
    expect(GAMES).toHaveLength(18)
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(18)
  })

  it('nunca repite el juego anterior', () => {
    for (const game of GAMES) {
      for (let seed = 0; seed < 40; seed++) {
        expect(nextGameId(game.id, seed)).not.toBe(game.id)
      }
    }
  })
})
