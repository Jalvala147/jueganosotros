import { describe, expect, it } from 'vitest'
import { PIANO_MAX_SPEED, PIANO_START_SPEED, pianoSpeed } from './pianoSpeed'

describe('velocidad de Teclas', () => {
  it('sube con cada tecla desde la primera y ya va muy rápido mucho antes del 140', () => {
    expect(pianoSpeed(0)).toBe(PIANO_START_SPEED)
    expect(pianoSpeed(1)).toBeGreaterThan(pianoSpeed(0) * 1.3)
    expect(pianoSpeed(2)).toBeGreaterThan(pianoSpeed(1) * 1.3)
    expect(pianoSpeed(10)).toBeGreaterThan(pianoSpeed(0) * 15)
    expect(pianoSpeed(15)).toBeLessThan(PIANO_MAX_SPEED)
    expect(pianoSpeed(40)).toBeGreaterThan(pianoSpeed(15))
    expect(pianoSpeed(140)).toBe(PIANO_MAX_SPEED)
  })

  it('también acelera con el tiempo, sin pasarse del tope', () => {
    expect(pianoSpeed(4, 8000)).toBeGreaterThan(pianoSpeed(4, 0))
    expect(pianoSpeed(80, 30_000)).toBe(PIANO_MAX_SPEED)
  })
})
