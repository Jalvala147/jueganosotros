import { useRef, useState, type ComponentType } from 'react'
import { GAME_MAP } from './catalog'
import type { GameId } from '../types'
import { ColorSwitch, Crossy, Flappy, LaneRace, Piano, Snake, Whack } from './arcade'
import { Hanoi, Memory, Puzzle2048, Simon } from './brain'
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
  hanoi: Hanoi,
  'lane-race': LaneRace,
}

export function GameHost({ id, seed, onFinish }: { id: GameId } & GameProps) {
  const Game = MAP[id]
  const meta = GAME_MAP[id]
  const [ready, setReady] = useState(false)
  const once = useRef(false)
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const stable = useRef((score: number) => {
    if (once.current) return
    once.current = true
    finishRef.current(score)
  })
  if (!ready) {
    return (
      <section className="card space-y-4 overflow-hidden p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ink/45">{meta.category}</p>
        <h2 className="display text-3xl font-bold leading-tight break-words text-ink">{meta.name}</h2>
        <p className="text-[17px] font-extrabold leading-relaxed break-words text-ink/80">{meta.guide}</p>
        <button
          type="button"
          className="btn btn-pink w-full"
          onPointerDown={(e) => {
            e.preventDefault()
            setReady(true)
          }}
        >
          Jugar
        </button>
      </section>
    )
  }
  return <Game key={`${id}:${seed}`} seed={seed} onFinish={stable.current} />
}
