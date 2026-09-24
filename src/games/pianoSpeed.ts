/** Tiles advanced per ~16.67ms frame. */
export const PIANO_START_SPEED = 0.038
export const PIANO_HIT_BOOST = 0.0027
export const PIANO_TIME_BOOST = 0.0015
export const PIANO_MAX_SPEED = 0.136

export function pianoSpeed(hits: number, elapsedMs = 0): number {
  const fromHits = Math.max(0, hits) * PIANO_HIT_BOOST
  const fromTime = (Math.max(0, elapsedMs) / 1000) * PIANO_TIME_BOOST
  return Math.min(PIANO_MAX_SPEED, PIANO_START_SPEED + fromHits + fromTime)
}
