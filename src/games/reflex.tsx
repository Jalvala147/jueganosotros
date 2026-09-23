import { useEffect, useRef, useState } from 'react'
import { mulberry32 } from '../lib/rng'
import { GameFrame, Overlay, useCanvas, useCountdown, type GameProps } from './kit'

export function GreenTap({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [score, setScore] = useState(0)
  const [green, setGreen] = useState(false)
  const [time, setTime] = useState(30)
  const live = left <= 0 && time > 0
  const scoreRef = useRef(0)

  useEffect(() => {
    if (!live) return
    const rng = mulberry32(seed)
    let on = false
    const tick = () => {
      on = rng() > 0.45
      setGreen(on)
    }
    tick()
    const iv = window.setInterval(tick, 650)
    const clock = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          window.clearInterval(iv)
          window.clearInterval(clock)
          onFinish(scoreRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      window.clearInterval(iv)
      window.clearInterval(clock)
    }
  }, [live, onFinish, seed])

  function tap() {
    if (!live) return
    const next = score + (green ? 1 : -1)
    scoreRef.current = next
    setScore(next)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <button onClick={tap} className="w-full">
      <GameFrame score={score} label={`${time}s`}>
        <div
          className="display flex h-80 items-center justify-center text-5xl font-bold text-white"
          style={{ background: green ? '#22c55e' : '#ff4571' }}
        >
          {green ? '¡TOCA!' : 'espera'}
        </div>
      </GameFrame>
    </button>
  )
}

export function Reaction({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rng = useRef(mulberry32(seed))
  const [round, setRound] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState<'wait' | 'go' | 'early'>('wait')
  const [times, setTimes] = useState<number[]>([])
  const start = useRef(0)
  const timer = useRef<number>(0)

  useEffect(() => {
    if (left > 0 || round >= 5) return
    setState('wait')
    const delay = 800 + rng.current() * 1800
    timer.current = window.setTimeout(() => {
      start.current = performance.now()
      setState('go')
    }, delay)
    return () => window.clearTimeout(timer.current)
  }, [left, retry, round])

  function tap() {
    if (left > 0) return
    if (state === 'wait') {
      window.clearTimeout(timer.current)
      setState('early')
      window.setTimeout(() => setRetry((n) => n + 1), 700)
      return
    }
    if (state !== 'go') return
    const ms = Math.round(performance.now() - start.current)
    const next = [...times, ms]
    setTimes(next)
    if (next.length >= 5) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length
      onFinish(Math.max(0, Math.round(10000 - avg * 8)))
    } else setRound((r) => r + 1)
  }

  if (left > 0) return <Overlay text={String(left)} />
  const tone =
    state === 'go'
      ? { bg: '#ffd145', fg: '#1c1430' }
      : state === 'early'
        ? { bg: '#ff4571', fg: '#fff' }
        : { bg: '#8260f6', fg: '#fff' }
  return (
    <button onClick={tap} className="w-full">
      <GameFrame score={`${times.length}/5`} label="reacción">
        <div className="flex h-80 flex-col items-center justify-center" style={{ background: tone.bg, color: tone.fg }}>
          <p className="display text-5xl font-bold">
            {state === 'go' ? '¡YA!' : state === 'early' ? 'muy pronto' : 'espera…'}
          </p>
          <p className="mt-2 text-sm font-black opacity-70">{times.join(' · ')}</p>
        </div>
      </GameFrame>
    </button>
  )
}

export function StopBar({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(280)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const pos = useRef(0)
  const dir = useRef(1)
  const zone = useRef({ x: 0.4, w: 0.22 })
  const live = useRef(false)
  const scoreRef = useRef(0)
  const roundRef = useRef(0)

  useEffect(() => {
    if (left > 0) return
    const rng = mulberry32(seed)
    const setup = () => {
      zone.current = { x: 0.15 + rng() * 0.5, w: Math.max(0.08, 0.24 - roundRef.current * 0.025) }
      pos.current = rng()
      dir.current = rng() > 0.5 ? 1 : -1
    }
    setup()
    live.current = true
    let raf = 0
    const loop = () => {
      const c = canvas.current
      if (!c) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      const w = c.width
      const h = c.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      const barY = h * 0.45
      const barH = h * 0.18
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(w * 0.08, barY, w * 0.84, barH)
      ctx.fillStyle = '#c8f542'
      ctx.fillRect(w * 0.08 + zone.current.x * w * 0.84, barY, zone.current.w * w * 0.84, barH)
      ctx.fillStyle = '#ff4d8d'
      ctx.fillRect(w * 0.08 + pos.current * w * 0.84 - 6, barY - 10, 12, barH + 20)
      pos.current += dir.current * (0.012 + roundRef.current * 0.002)
      if (pos.current > 1 || pos.current < 0) dir.current *= -1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const click = () => {
      if (!live.current) return
      const z = zone.current
      const hit = pos.current >= z.x && pos.current <= z.x + z.w
      const gained = hit ? Math.round(100 + (0.24 - z.w) * 400) : 0
      scoreRef.current += gained
      setScore(scoreRef.current)
      if (roundRef.current >= 7) {
        live.current = false
        onFinish(scoreRef.current)
        return
      }
      roundRef.current += 1
      setRound(roundRef.current)
      setup()
    }
    cListener(canvas.current, click)
    return () => {
      cancelAnimationFrame(raf)
      dropListener(canvas.current, click)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={`ronda ${round + 1}/8`}>
      <canvas ref={canvas} className="block w-full" />
    </GameFrame>
  )
}

function cListener(c: HTMLCanvasElement | null, fn: () => void) {
  c?.addEventListener('pointerdown', fn)
}
function dropListener(c: HTMLCanvasElement | null, fn: () => void) {
  c?.removeEventListener('pointerdown', fn)
}
