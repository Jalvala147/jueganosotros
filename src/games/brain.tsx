import { useEffect, useMemo, useState } from 'react'
import { mulberry32, pick, randInt, shuffle } from '../lib/rng'
import { GameFrame, Overlay, useCountdown, type GameProps } from './kit'

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308']

export function Simon({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rng = useMemo(() => mulberry32(seed), [seed])
  const [seq, setSeq] = useState<number[]>([])
  const [lit, setLit] = useState<number | null>(null)
  const [input, setInput] = useState(false)
  const [step, setStep] = useState(0)

  function play(next: number[]) {
    setInput(false)
    let i = 0
    const iv = window.setInterval(() => {
      setLit(next[i] ?? null)
      window.setTimeout(() => setLit(null), 320)
      i += 1
      if (i >= next.length) {
        window.clearInterval(iv)
        setInput(true)
      }
    }, 520)
  }

  useEffect(() => {
    if (left > 0) return
    const first = [randInt(rng, 0, 3)]
    setSeq(first)
    play(first)
  }, [left, rng])

  function tap(n: number) {
    if (!input) return
    if (n !== seq[step]) {
      onFinish(seq.length - 1)
      return
    }
    if (step + 1 === seq.length) {
      const next = [...seq, randInt(rng, 0, 3)]
      setSeq(next)
      setStep(0)
      window.setTimeout(() => play(next), 400)
    } else setStep((s) => s + 1)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={Math.max(0, seq.length - 1)} label="repite">
      <div className="grid grid-cols-2 gap-3 p-4">
        {COLORS.map((c, i) => (
          <button
            key={c}
            onClick={() => tap(i)}
            className="h-28 rounded-[1.4rem] border-[3px] border-ink shadow-[0_4px_0_#1c1430]"
            style={{ background: c, filter: lit === i ? 'brightness(1.25)' : 'brightness(0.82)' }}
          />
        ))}
      </div>
    </GameFrame>
  )
}

export function Puzzle2048({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rngRef = useMemo(() => ({ rng: mulberry32(seed) }), [seed])
  const [board, setBoard] = useState<number[]>(Array(16).fill(0))
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(60)

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
        className="grid grid-cols-4 gap-2 p-3"
        onPointerUp={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - 0.5
          const y = (e.clientY - r.top) / r.height - 0.5
          if (Math.abs(x) > Math.abs(y)) slide(x > 0 ? 'r' : 'l')
          else slide(y > 0 ? 'd' : 'u')
        }}
      >
        {board.map((n, i) => (
          <div
            key={i}
            className="display flex aspect-square items-center justify-center rounded-2xl border-[3px] border-ink text-lg font-bold text-ink"
            style={{ background: n ? `hsl(${28 + Math.log2(n) * 16} 90% 62%)` : '#efe6ff' }}
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
      <div className="grid grid-cols-4 gap-2 p-3">
        {deck.map((icon, i) => {
          const show = open.includes(i) || done.includes(i)
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              className={`flex aspect-square items-center justify-center rounded-2xl border-[3px] border-ink text-2xl shadow-[0_3px_0_#1c1430] ${
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

export function QuickMaths({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rng = useMemo(() => mulberry32(seed), [seed])
  const [q, setQ] = useState({ text: '', answer: 0 })
  const [value, setValue] = useState('')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(30)

  function nextQ() {
    const a = randInt(rng, 2, 12)
    const b = randInt(rng, 2, 12)
    const op = pick(rng, ['+', '-', '×'] as const)
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b
    setQ({ text: `${a} ${op} ${b}`, answer })
    setValue('')
  }

  useEffect(() => {
    if (left > 0) return
    nextQ()
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

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={`${time}s`}>
      <div className="space-y-3 p-4">
        <p className="display text-center text-5xl font-bold text-ink">{q.text}</p>
        <input
          className="input text-center text-2xl"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (Number(value) === q.answer) {
                setScore((s) => s + 1)
                nextQ()
              } else setValue('')
            }
          }}
        />
        <button
          className="btn btn-pink w-full"
          onClick={() => {
            if (Number(value) === q.answer) {
              setScore((s) => s + 1)
              nextQ()
            } else setValue('')
          }}
        >
          Enviar
        </button>
      </div>
    </GameFrame>
  )
}

const WORDS = [
  'juego', 'amigo', 'ronda', 'punto', 'grupo', 'ficha', 'nieve', 'playa', 'verde', 'dulce',
  'carta', 'silla', 'nubes', 'fuego', 'campo', 'linea', 'tecla', 'mundo', 'piano', 'cobra',
  'farol', 'fruta', 'huevo', 'lucha', 'mango', 'norte', 'ocaso', 'perro', 'queso', 'radio',
]

export function Wordle({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const word = useMemo(() => WORDS[seed % WORDS.length]!, [seed])
  const [guess, setGuess] = useState('')
  const [rows, setRows] = useState<string[]>([])

  function submit() {
    if (guess.length !== 5) return
    const next = [...rows, guess.toLowerCase()]
    setRows(next)
    setGuess('')
    if (guess.toLowerCase() === word) onFinish((7 - next.length) * 100)
    else if (next.length >= 6) onFinish(0)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={`${rows.length}/6`} label="5 letras">
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          {rows.map((r, ri) => (
            <div key={ri} className="grid grid-cols-5 gap-1">
              {r.split('').map((ch, i) => {
                const color =
                  word[i] === ch
                    ? 'bg-yellow text-ink'
                    : word.includes(ch)
                      ? 'bg-pink text-white'
                      : 'bg-mute text-white'
                return (
                  <div key={i} className={`rounded-lg border-[3px] border-ink py-2 text-center font-extrabold uppercase ${color}`}>
                    {ch}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <input
          className="input text-center uppercase tracking-[0.28em]"
          maxLength={5}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button className="btn btn-pink w-full" onClick={submit}>
          Probar
        </button>
      </div>
    </GameFrame>
  )
}

export function WaterSort({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [tubes, setTubes] = useState<string[][]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)

  useEffect(() => {
    if (left > 0) return
    const rng = mulberry32(seed)
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308']
    let tubes: string[][] = colors.map((c) => [c, c, c, c])
    tubes.push([], [])
    for (let n = 0; n < 28; n++) {
      const from = randInt(rng, 0, tubes.length - 1)
      const to = randInt(rng, 0, tubes.length - 1)
      if (from === to || tubes[from]!.length === 0 || tubes[to]!.length >= 4) continue
      const color = tubes[from]![tubes[from]!.length - 1]
      const top = tubes[to]![tubes[to]!.length - 1]
      if (top && top !== color) continue
      tubes = tubes.map((t) => [...t])
      tubes[to]!.push(tubes[from]!.pop()!)
    }
    setTubes(tubes)
  }, [left, seed])

  function tap(i: number) {
    if (sel == null) {
      if (tubes[i]?.length) setSel(i)
      return
    }
    if (sel === i) {
      setSel(null)
      return
    }
    const from = [...(tubes[sel] ?? [])]
    const to = [...(tubes[i] ?? [])]
    const color = from[from.length - 1]
    if (!color || to.length >= 4 || (to.length && to[to.length - 1] !== color)) {
      setSel(null)
      return
    }
    while (from[from.length - 1] === color && to.length < 4) to.push(from.pop()!)
    const next = tubes.map((t, idx) => (idx === sel ? from : idx === i ? to : t))
    setTubes(next)
    setMoves((m) => m + 1)
    setSel(null)
    const won = next.every((t) => t.length === 0 || (t.length === 4 && t.every((c) => c === t[0])))
    if (won) onFinish(moves + 1)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={moves} label="menos movimientos">
      <div className="grid grid-cols-3 gap-3 p-4">
        {tubes.map((t, i) => (
          <button
            key={i}
            onClick={() => tap(i)}
            className={`flex h-40 flex-col-reverse overflow-hidden rounded-b-[1.4rem] rounded-t-lg border-[3px] bg-white ${
              sel === i ? 'border-pink' : 'border-ink'
            }`}
          >
            {t.map((c, k) => (
              <div key={k} className="h-8" style={{ background: c }} />
            ))}
          </button>
        ))}
      </div>
    </GameFrame>
  )
}
