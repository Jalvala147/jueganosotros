/** Tiles advanced per ~16.67ms frame. ~60× these values is tiles per second. */
export const PIANO_START_SPEED = 0.08
export const PIANO_PER_TILE = 1.35
export const PIANO_TIME_BOOST = 0.008
export const PIANO_MAX_SPEED = 12

export function pianoSpeed(hits: number, elapsedMs = 0): number {
  const n = Math.max(0, hits)
  const fromTiles = PIANO_START_SPEED * PIANO_PER_TILE ** n
  const fromTime = (Math.max(0, elapsedMs) / 1000) * PIANO_TIME_BOOST
  return Math.min(PIANO_MAX_SPEED, fromTiles + fromTime)
}
