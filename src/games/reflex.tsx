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
    <button
      className="w-full touch-none"
      onPointerDown={(e) => {
        e.preventDefault()
        tap()
      }}
    >
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
      const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length)
      onFinish(avg)
    } else setRound((r) => r + 1)
  }

  if (left > 0) return <Overlay text={String(left)} />
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null
  const tone =
    state === 'go'
      ? { bg: '#ffd145', fg: '#1c1430' }
      : state === 'early'
        ? { bg: '#ff4571', fg: '#fff' }
        : { bg: '#8260f6', fg: '#fff' }
  return (
    <button
      className="w-full touch-none"
      onPointerDown={(e) => {
        e.preventDefault()
        tap()
      }}
    >
      <GameFrame score={avg == null ? '—' : `${avg} ms`} label={`${times.length}/5`}>
        <div className="flex h-80 flex-col items-center justify-center px-4 text-center" style={{ background: tone.bg, color: tone.fg }}>
          <p className="display text-5xl font-bold">
            {state === 'go' ? '¡YA!' : state === 'early' ? 'muy pronto' : 'espera…'}
          </p>
          <p className="mt-3 text-sm font-black opacity-80">
            {avg == null ? 'El resultado es el promedio' : `Promedio ${avg} ms`}
          </p>
          <p className="mt-1 text-sm font-black opacity-70">{times.map((ms) => `${ms} ms`).join(' · ')}</p>
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
  const [note, setNote] = useState('Toca cuando la aguja esté en el verde')
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
    let frozen = false
    let verdict: 'hit' | 'miss' | null = null
    let resumeAt = 0
    let raf = 0
    const loop = () => {
      const c = canvas.current
      if (!c) return
      const ctx = c.getContext('2d')
      if (!ctx) return
      if (frozen && performance.now() >= resumeAt) {
        frozen = false
        verdict = null
        if (roundRef.current >= 7) {
          live.current = false
          onFinish(scoreRef.current)
          return
        }
        roundRef.current += 1
        setRound(roundRef.current)
        setNote('Toca cuando la aguja esté en el verde')
        setup()
      }
      const w = c.width
      const h = c.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = verdict === 'hit' ? '#14532d' : verdict === 'miss' ? '#4c0519' : '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      const barY = h * 0.48
      const barH = h * 0.2
      const trackX = w * 0.08
      const trackW = w * 0.84
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(trackX, barY, trackW, barH)
      ctx.fillStyle = '#c8f542'
      ctx.fillRect(trackX + zone.current.x * trackW, barY, zone.current.w * trackW, barH)
      ctx.strokeStyle = '#f8fafc'
      ctx.lineWidth = 3
      ctx.strokeRect(trackX + zone.current.x * trackW, barY, zone.current.w * trackW, barH)
      const needleW = Math.max(10, w * 0.018)
      const needleX = trackX + pos.current * trackW - needleW / 2
      ctx.fillStyle = '#ff4d8d'
      ctx.fillRect(needleX, barY - barH * 0.35, needleW, barH * 1.7)
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${Math.round(h * 0.16)}px Nunito, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(verdict === 'hit' ? '¡DENTRO!' : verdict === 'miss' ? 'FUERA' : 'ZONA VERDE', w / 2, h * 0.28)
      if (!frozen) {
        pos.current += dir.current * (0.012 + roundRef.current * 0.002)
        if (pos.current > 1 || pos.current < 0) dir.current *= -1
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const click = (e: PointerEvent) => {
      e.preventDefault()
      if (!live.current || frozen) return
      frozen = true
      const z = zone.current
      const hit = pos.current >= z.x && pos.current <= z.x + z.w
      verdict = hit ? 'hit' : 'miss'
      const gained = hit ? Math.round(100 + (0.24 - z.w) * 400) : 0
      scoreRef.current += gained
      setScore(scoreRef.current)
      setNote(hit ? '¡Dentro! La aguja se quedó en la zona' : 'Fuera. La aguja se paró aquí')
      resumeAt = performance.now() + 900
    }
    cListener(canvas.current, click)
    return () => {
      cancelAnimationFrame(raf)
      dropListener(canvas.current, click)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={`ronda ${round + 1}/8 · ${note}`}>
      <canvas ref={canvas} className="block w-full touch-none" />
    </GameFrame>
  )
}

function cListener(c: HTMLCanvasElement | null, fn: (e: PointerEvent) => void) {
  c?.addEventListener('pointerdown', fn)
}
function dropListener(c: HTMLCanvasElement | null, fn: (e: PointerEvent) => void) {
  c?.removeEventListener('pointerdown', fn)
}
