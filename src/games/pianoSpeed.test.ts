import { describe, expect, it } from 'vitest'
import { PIANO_MAX_SPEED, PIANO_START_SPEED, pianoSpeed } from './pianoSpeed'

describe('velocidad de Teclas', () => {
  it('arranca jugable y a los 140 ya va mucho más rápido', () => {
    expect(pianoSpeed(0)).toBe(PIANO_START_SPEED)
    expect(pianoSpeed(15)).toBeGreaterThan(pianoSpeed(0) * 2.2)
    expect(pianoSpeed(40)).toBeGreaterThan(pianoSpeed(0) * 4)
    expect(pianoSpeed(40)).toBeLessThan(PIANO_MAX_SPEED)
    expect(pianoSpeed(140)).toBe(PIANO_MAX_SPEED)
    expect(PIANO_MAX_SPEED).toBeGreaterThan(PIANO_START_SPEED * 6)
  })

  it('también acelera con el tiempo, sin pasarse del tope', () => {
    expect(pianoSpeed(4, 8000)).toBeGreaterThan(pianoSpeed(4, 0))
    expect(pianoSpeed(140, 30_000)).toBe(PIANO_MAX_SPEED)
  })
})
