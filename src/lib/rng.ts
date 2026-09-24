/** Mulberry32 — misma semilla = misma partida para todo el grupo. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** La oportunidad 1 usa la semilla de la ronda. La 2 es otra, igual para todo el grupo. */
export function attemptSeed(seed: number, attempt: number): number {
  let n = seed >>> 0
  const steps = Math.max(0, attempt)
  for (let i = 0; i < steps; i++) n = (Math.imul(n, 1664525) + 1013904223) >>> 0
  if (steps > 0 && n === (seed >>> 0)) n = (n + 1) >>> 0
  return n
}

export function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!
}

export function shuffle<T>(rng: () => number, list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}
