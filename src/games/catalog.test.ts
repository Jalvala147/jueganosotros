import { describe, expect, it } from 'vitest'
import { GAMES, nextGameId } from './catalog'

describe('catalogo', () => {
  it('tiene 20 juegos distintos', () => {
    expect(GAMES).toHaveLength(20)
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(20)
  })

  it('nunca repite el juego anterior', () => {
    for (const game of GAMES) {
      for (let seed = 0; seed < 40; seed++) {
        expect(nextGameId(game.id, seed)).not.toBe(game.id)
      }
    }
  })
})
