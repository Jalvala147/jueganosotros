import { useEffect, useMemo, useRef, useState } from 'react'
import { mulberry32, pick, randInt, shuffle } from '../lib/rng'
import { GameFrame, Overlay, useCountdown, type GameProps } from './kit'

const PADS = [
  { rest: '#ff3b30', lit: '#ffb1ab', pressed: '#7a120c', ink: '#1c1430', n: '1' },
  { rest: '#34c759', lit: '#c8f8d4', pressed: '#0d5c28', ink: '#1c1430', n: '2' },
  { rest: '#007aff', lit: '#b9dcff', pressed: '#003f86', ink: '#1c1430', n: '3' },
  { rest: '#ffcc00', lit: '#fff3b0', pressed: '#8a6a00', ink: '#1c1430', n: '4' },
]

export function Simon({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rng = useMemo(() => mulberry32(seed), [seed])
  const [lit, setLit] = useState<number | null>(null)
  const [pressed, setPressed] = useState<number | null>(null)
  const [phase, setPhase] = useState('Mira el orden')
  const [score, setScore] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const runId = useRef(0)
  const inputRef = useRef(false)
  const seqRef = useRef<number[]>([])
  const stepRef = useRef(0)
  const pendingRef = useRef<number[] | null>(null)

  function wait(ms: number, id: number) {
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(runId.current === id), ms)
    })
  }

  async function playback(sequence: number[]) {
    const id = ++runId.current
    inputRef.current = false
    setPressed(null)
    setLit(null)
    const hold = Math.max(340, 620 - sequence.length * 28)
    const gap = Math.max(180, 320 - sequence.length * 12)
    if (!(await wait(420, id))) return
    for (let i = 0; i < sequence.length; i++) {
      if (runId.current !== id) return
      setPhase(`Mira ${i + 1} de ${sequence.length}`)
      setLit(sequence[i] ?? null)
      if (!(await wait(hold, id))) return
      setLit(null)
      if (!(await wait(gap, id))) return
    }
    if (runId.current !== id) return
    setLit(null)
    stepRef.current = 0
    inputRef.current = true
    setPhase(`Tu turno · 0 de ${sequence.length}`)
  }

  useEffect(() => {
    if (left > 0) return
    const first = [randInt(rng, 0, 3)]
    seqRef.current = first
    stepRef.current = 0
    void playback(first)
    return () => {
      runId.current += 1
    }
  }, [left, rng])

  function tap(n: number) {
    if (!inputRef.current) return
    const expect = seqRef.current[stepRef.current]
    setPressed(n)
    if (n !== expect) {
      inputRef.current = false
      runId.current += 1
      setPhase('Ese no era')
      window.setTimeout(() => onFinish(score), 700)
      return
    }
    const nextStep = stepRef.current + 1
    if (nextStep === seqRef.current.length) {
      inputRef.current = false
      const grown = [...seqRef.current, randInt(rng, 0, 3)]
      seqRef.current = grown
      stepRef.current = 0
      setScore(grown.length - 1)
      pendingRef.current = grown
      setWaiting(true)
      setPhase('Toca siguiente cuando quieras')
      return
    }
    stepRef.current = nextStep
    setPhase(`Tu turno · ${nextStep} de ${seqRef.current.length}`)
    window.setTimeout(() => setPressed((current) => (current === n ? null : current)), 220)
  }

  function continueSequence() {
    const grown = pendingRef.current
    if (!grown) return
    pendingRef.current = null
    setWaiting(false)
    setPressed(null)
    void playback(grown)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={phase.startsWith('Tu turno') ? 'tu turno' : 'mira'}>
      <p className="px-4 pt-4 text-center text-sm font-extrabold leading-relaxed break-words text-ink/70">{phase}</p>
      <div className="grid grid-cols-2 gap-3 p-4">
        {PADS.map((pad, i) => {
          const showing = lit === i
          const held = pressed === i
          return (
            <button
              key={pad.n}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                tap(i)
              }}
              className="grid h-28 place-items-center rounded-[1.4rem] border-[3px] border-ink"
              style={{
                background: held ? pad.pressed : showing ? pad.lit : pad.rest,
                color: held ? '#fff' : pad.ink,
                boxShadow: held || showing ? '0 0 0 5px #fff, 0 4px 0 #1c1430' : '0 4px 0 #1c1430',
                transform: held ? 'scale(0.96)' : showing ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <span className="display text-4xl font-bold leading-none">{pad.n}</span>
            </button>
          )
        })}
      </div>
      {waiting ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              continueSequence()
            }}
            className="display w-full rounded-2xl border-[3px] border-ink bg-yellow px-4 py-3 text-lg font-bold text-ink"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </GameFrame>
  )
}

export function Puzzle2048({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rngRef = useMemo(() => ({ rng: mulberry32(seed) }), [seed])
  const [board, setBoard] = useState<number[]>(Array(16).fill(0))
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(60)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  function spawn(cells: number[]) {
    const empties = cells.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0)
    if (!empties.length) return cells
    const copy = [...cells]
    copy[pick(rngRef.rng, empties)] = rngRef.rng() > 0.9 ? 4 : 2
    return copy
  }

  useEffect(() => {
    if (left > 0) return
    setBoard(spawn(spawn(Array(16).fill(0))))
    const iv = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          window.clearInterval(iv)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => window.clearInterval(iv)
  }, [left])

  useEffect(() => {
    if (left > 0) return
    if (time === 0) onFinish(score)
  }, [left, onFinish, score, time])

  function slide(dir: 'l' | 'r' | 'u' | 'd') {
    const get = (x: number, y: number) => board[y * 4 + x]!
    let gained = 0
    const next = Array(16).fill(0)
    const lines = [0, 1, 2, 3].map((i) => {
      const cells: number[] = []
      for (let j = 0; j < 4; j++) {
        if (dir === 'l') cells.push(get(j, i))
        if (dir === 'r') cells.push(get(3 - j, i))
        if (dir === 'u') cells.push(get(i, j))
        if (dir === 'd') cells.push(get(i, 3 - j))
      }
      const compact = cells.filter(Boolean)
      const merged: number[] = []
      for (let k = 0; k < compact.length; k++) {
        if (compact[k] === compact[k + 1]) {
          merged.push(compact[k]! * 2)
          gained += compact[k]! * 2
          k++
        } else merged.push(compact[k]!)
      }
      while (merged.length < 4) merged.push(0)
      return merged
    })
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const v = lines[i]![j]!
        if (dir === 'l') next[i * 4 + j] = v
        if (dir === 'r') next[i * 4 + (3 - j)] = v
        if (dir === 'u') next[j * 4 + i] = v
        if (dir === 'd') next[(3 - j) * 4 + i] = v
      }
    }
    if (next.every((v, i) => v === board[i])) return
    setBoard(spawn(next))
    setScore((s) => s + gained)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={`${time}s`}>
      <div
        className="grid touch-none grid-cols-4 gap-2 p-3"
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          swipeStart.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerUp={(e) => {
          const start = swipeStart.current
          if (!start) return
          const dx = e.clientX - start.x
          const dy = e.clientY - start.y
          swipeStart.current = null
          if (Math.hypot(dx, dy) < 24) return
          if (Math.abs(dx) > Math.abs(dy)) slide(dx > 0 ? 'r' : 'l')
          else slide(dy > 0 ? 'd' : 'u')
        }}
      >
        {board.map((n, i) => (
          <div
            key={i}
            className="display flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-[3px] border-ink px-0.5 font-bold leading-none text-ink"
            style={{
              background: n ? `hsl(${28 + Math.log2(n) * 16} 90% 62%)` : '#efe6ff',
              fontSize: n >= 1000 ? '0.7rem' : n >= 128 ? '0.95rem' : '1.15rem',
            }}
          >
            {n || ''}
          </div>
        ))}
      </div>
    </GameFrame>
  )
}

export function Memory({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const icons = ['🍎', '🍋', '🍇', '🍑', '🥑', '🍒', '🥝', '🍍']
  const deck = useMemo(() => {
    const rng = mulberry32(seed)
    return shuffle(rng, [...icons, ...icons])
  }, [seed])
  const [open, setOpen] = useState<number[]>([])
  const [done, setDone] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [started, setStarted] = useState(0)

  useEffect(() => {
    if (left === 0) setStarted(Date.now())
  }, [left])

  function tap(i: number) {
    if (open.includes(i) || done.includes(i) || open.length === 2) return
    const next = [...open, i]
    setOpen(next)
    if (next.length === 2) {
      const [a, b] = next
      const matched = deck[a!] === deck[b!]
      setMoves((m) => {
        const count = m + 1
        if (matched && done.length + 2 === 16) {
          const secs = Math.round((Date.now() - started) / 1000)
          onFinish(count * 10 + secs)
        }
        return count
      })
      if (matched) {
        setDone([...done, a!, b!])
        setOpen([])
      } else window.setTimeout(() => setOpen([]), 650)
    }
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={`${moves} mov`} label="parejas">
      <div className="grid touch-none grid-cols-4 gap-2 p-3">
        {deck.map((icon, i) => {
          const show = open.includes(i) || done.includes(i)
          return (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                tap(i)
              }}
              className={`flex min-h-16 aspect-square items-center justify-center rounded-2xl border-[3px] border-ink text-2xl shadow-[0_3px_0_#1c1430] ${
                show ? 'bg-white' : 'bg-purple text-white'
              }`}
            >
              {show ? icon : '✦'}
            </button>
          )
        })}
      </div>
    </GameFrame>
  )
}

const HANOI_COLORS = ['#28dad4', '#ffd145', '#ff4571', '#8260f6']

export function Hanoi({ seed, onFinish }: GameProps) {
  void seed
  const left = useCountdown()
  const [pegs, setPegs] = useState<number[][]>([
    [4, 3, 2, 1],
    [],
    [],
  ])
  const [from, setFrom] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [note, setNote] = useState('Toca una torre para tomar el disco de arriba.')
  const done = useRef(false)

  function tap(index: number) {
    if (left > 0 || done.current) return
    const stack = pegs[index] ?? []
    if (from == null) {
      if (stack.length === 0) {
        setNote('Esa torre está vacía.')
        return
      }
      setFrom(index)
      setNote('Ahora toca dónde lo quieres dejar.')
      return
    }
    if (from === index) {
      setFrom(null)
      setNote('Toca una torre para tomar el disco de arriba.')
      return
    }
    const src = pegs[from] ?? []
    const disk = src[src.length - 1]
    const top = stack[stack.length - 1]
    if (disk == null || (top != null && disk > top)) {
      setFrom(null)
      setNote('No cabe. Solo un disco más chico puede ir encima.')
      return
    }
    const next = pegs.map((peg) => [...peg])
    next[from]!.pop()
    next[index]!.push(disk)
    const count = moves + 1
    setPegs(next)
    setMoves(count)
    setFrom(null)
    if (next[2]!.length === 4) {
      done.current = true
      setNote('Listo. Todos quedaron en la torre de la derecha.')
      onFinish(count)
      return
    }
    setNote('Toca una torre para tomar el disco de arriba.')
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={moves} label="menos movimientos">
      <div className="grid grid-cols-3 gap-2 px-3 pt-3">
        {pegs.map((stack, index) => (
          <button
            key={index}
            type="button"
            className={`relative flex h-80 touch-none flex-col-reverse justify-start rounded-2xl border-[3px] px-1 pb-4 ${
              from === index ? 'border-pink bg-yellow/40' : 'border-ink bg-white'
            }`}
            onPointerDown={(e) => {
              e.preventDefault()
              tap(index)
            }}
          >
            <span className="absolute left-1/2 top-3 h-[78%] w-2 -translate-x-1/2 rounded-full bg-ink" />
            <span className="absolute bottom-2 left-2 right-2 h-3 rounded-full bg-ink" />
            {stack.map((disk, level) => (
              <span
                key={`${disk}-${level}`}
                className="relative z-10 mx-auto mb-1 h-9 rounded-full border-[3px] border-ink"
                style={{
                  width: `${40 + disk * 14}%`,
                  background: HANOI_COLORS[disk - 1],
                  transform: from === index && level === stack.length - 1 ? 'translateY(-18px)' : undefined,
                }}
              />
            ))}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 px-3 pb-1 text-center text-[11px] font-black uppercase tracking-wide text-ink/50">
        <span>Inicio</span>
        <span>Centro</span>
        <span>Meta</span>
      </div>
      <p className="px-4 py-3 text-center text-sm font-extrabold leading-relaxed break-words text-ink/70">{note}</p>
    </GameFrame>
  )
}
