import { describe, expect, it } from 'vitest'
import { PIANO_MAX_SPEED, PIANO_START_SPEED, pianoSpeed } from './pianoSpeed'

describe('velocidad de Teclas', () => {
  it('arranca en un ritmo jugable y sube poco a poco', () => {
    expect(pianoSpeed(0)).toBe(PIANO_START_SPEED)
    expect(pianoSpeed(0)).toBeGreaterThan(0.03)
    expect(pianoSpeed(8)).toBeGreaterThan(pianoSpeed(0) * 1.5)
    expect(pianoSpeed(18)).toBeGreaterThan(pianoSpeed(8))
    expect(pianoSpeed(18)).toBeLessThan(PIANO_MAX_SPEED)
    expect(pianoSpeed(50)).toBe(PIANO_MAX_SPEED)
  })

  it('también acelera con el tiempo, sin pasarse del tope', () => {
    expect(pianoSpeed(4, 8000)).toBeGreaterThan(pianoSpeed(4, 0))
    expect(pianoSpeed(80, 30_000)).toBe(PIANO_MAX_SPEED)
  })
})
