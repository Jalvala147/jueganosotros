import { useRef, type ComponentType } from 'react'
import type { GameId } from '../types'
import { ColorSwitch, Crossy, Flappy, LaneRace, Piano, Snake, Whack } from './arcade'
import { Memory, Puzzle2048, QuickMaths, Simon, WaterSort, Wordle } from './brain'
import type { GameProps } from './kit'
import { GreenTap, Reaction, StopBar } from './reflex'
import { Darts, Knives, Penalty, Stack } from './skill'

const MAP: Record<GameId, ComponentType<GameProps>> = {
  'green-tap': GreenTap,
  reaction: Reaction,
  'stop-bar': StopBar,
  whack: Whack,
  simon: Simon,
  flappy: Flappy,
  snake: Snake,
  stack: Stack,
  crossy: Crossy,
  'color-switch': ColorSwitch,
  knives: Knives,
  darts: Darts,
  penalty: Penalty,
  piano: Piano,
  'puzzle-2048': Puzzle2048,
  memory: Memory,
  'quick-maths': QuickMaths,
  wordle: Wordle,
  'water-sort': WaterSort,
  'lane-race': LaneRace,
}

export function GameHost({ id, seed, onFinish }: { id: GameId } & GameProps) {
  const Game = MAP[id]
  const once = useRef(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const stable = useRef((score: number) => {
    if (once.current) return
    once.current = true
    finishRef.current(score)
  })
  return <Game key={`${id}:${seed}`} seed={seed} onFinish={stable.current} />
}
