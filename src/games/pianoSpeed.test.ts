import { describe, expect, it } from 'vitest'
import { PIANO_MAX_SPEED, PIANO_START_SPEED, pianoSpeed } from './pianoSpeed'

describe('velocidad de Teclas', () => {
  it('sigue subiendo mucho después del puntaje 140', () => {
    expect(pianoSpeed(0)).toBe(PIANO_START_SPEED)
    expect(pianoSpeed(10) - pianoSpeed(0)).toBeCloseTo(8)
    expect(pianoSpeed(40)).toBeGreaterThan(pianoSpeed(10) * 2)
    expect(pianoSpeed(140)).toBeGreaterThan(pianoSpeed(40))
    expect(pianoSpeed(140)).toBeLessThan(PIANO_MAX_SPEED)
  })

  it('también acelera con el tiempo y solo tiene un tope muy lejano', () => {
    expect(pianoSpeed(4, 8000)).toBeGreaterThan(pianoSpeed(4, 0))
    expect(pianoSpeed(400, 60_000)).toBe(PIANO_MAX_SPEED)
  })
})
