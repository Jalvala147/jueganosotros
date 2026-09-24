/** Tiles advanced per ~16.67ms frame. ~60× these values is tiles per second. */
export const PIANO_START_SPEED = 0.64
export const PIANO_HIT_BOOST = 0.8
export const PIANO_TIME_BOOST = 0.48
export const PIANO_MAX_SPEED = 192

export function pianoSpeed(hits: number, elapsedMs = 0): number {
  const fromHits = Math.max(0, hits) * PIANO_HIT_BOOST
  const fromTime = (Math.max(0, elapsedMs) / 1000) * PIANO_TIME_BOOST
  return Math.min(PIANO_MAX_SPEED, PIANO_START_SPEED + fromHits + fromTime)
}
