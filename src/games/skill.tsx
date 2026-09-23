import { useEffect, useRef, useState } from 'react'
import { mulberry32, randInt } from '../lib/rng'
import { GameFrame, Overlay, useCanvas, useCountdown, type GameProps } from './kit'

export function Stack({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(460)
  const scoreRef = useRef(0)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    let width = 0.62
    let x = 0
    let dir = 1
    let stack = 0
    let center = 0.5
    const drop = () => {
      const leftEdge = Math.max(center - width / 2, x - width / 2)
      const rightEdge = Math.min(center + width / 2, x + width / 2)
      const overlap = rightEdge - leftEdge
      if (overlap < 0.04) {
        onFinish(stack)
        return 'dead'
      }
      center = (leftEdge + rightEdge) / 2
      width = overlap
      stack += 1
      scoreRef.current = stack
      x = rng() > 0.5 ? -0.1 : 1.1
      dir = x < 0 ? 1 : -1
      return 'ok'
    }
    c.addEventListener('pointerdown', drop)
    let raf = 0
    const loop = () => {
      const w = c.width
      const h = c.height
      ctx.fillStyle = '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      x += dir * (0.008 + stack * 0.0004)
      if (x > 1.15 || x < -0.15) dir *= -1
      for (let i = 0; i < stack; i++) {
        ctx.fillStyle = i % 2 ? '#c8f542' : '#3de0ff'
        ctx.fillRect((center - width / 2) * w, h - 28 - i * 18, width * w, 16)
      }
      ctx.fillStyle = '#ff4d8d'
      ctx.fillRect((x - width / 2) * w, h - 28 - stack * 18, width * w, 16)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', drop)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame label="toca para soltar">
      <canvas ref={canvas} className="block w-full" />
    </GameFrame>
  )
}

export function Knives({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(440)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    const stuck: number[] = []
    let angle = 0
    let speed = 0.025 + rng() * 0.01
    let dead = false
    let points = 0
    const throwK = () => {
      if (dead) return
      const a = (angle + Math.PI / 2) % (Math.PI * 2)
      if (stuck.some((s) => Math.abs(Math.atan2(Math.sin(s - a), Math.cos(s - a))) < 0.28)) {
        dead = true
        onFinish(points)
        return
      }
      stuck.push(a)
      points += 1
      setScore(points)
      speed += 0.0015
    }
    c.addEventListener('pointerdown', throwK)
    let raf = 0
    const loop = () => {
      if (dead) return
      angle += speed
      const w = c.width
      const h = c.height
      ctx.fillStyle = '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h * 0.38)
      ctx.rotate(angle)
      ctx.fillStyle = '#8b5a2b'
      ctx.beginPath()
      ctx.arc(0, 0, 70, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e2e8f0'
      for (const s of stuck) {
        ctx.save()
        ctx.rotate(s)
        ctx.fillRect(-4, 60, 8, 70)
        ctx.restore()
      }
      ctx.restore()
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(w / 2 - 4, h * 0.72, 8, 70)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', throwK)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="clava sin chocar">
      <canvas ref={canvas} className="block w-full" />
    </GameFrame>
  )
}

export function Darts({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [stage, setStage] = useState<'power' | 'angle' | 'fly'>('power')
  const [power, setPower] = useState(0)
  const [angle, setAngle] = useState(0)
  const [score, setScore] = useState(0)
  const [darts, setDarts] = useState(0)
  const t = useRef(0)
  const dir = useRef(1)
  const canvas = useCanvas(400)
  const scoreRef = useRef(0)
  const dartsRef = useRef(0)

  useEffect(() => {
    if (left > 0) return
    let raf = 0
    const loop = () => {
      t.current += 0.03 * dir.current
      if (t.current > 1 || t.current < 0) dir.current *= -1
      if (stage === 'power') setPower(t.current)
      if (stage === 'angle') setAngle(t.current)
      const c = canvas.current
      const ctx = c?.getContext('2d')
      if (c && ctx) {
        const w = c.width
        const h = c.height
        ctx.fillStyle = '#0a0d18'
        ctx.fillRect(0, 0, w, h)
        const rings = ['#111', '#b91c1c', '#111', '#b91c1c', '#facc15']
        rings.forEach((color, i) => {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(w / 2, h * 0.38, 110 - i * 20, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.fillStyle = '#c8f542'
        ctx.fillRect(20, h * 0.82, (w - 40) * (stage === 'angle' ? angle : power), 16)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [angle, canvas, left, power, seed, stage])

  function tap() {
    if (left > 0) return
    if (stage === 'power') {
      setStage('angle')
      return
    }
    if (stage === 'angle') {
      const err = Math.abs(0.5 - power) + Math.abs(0.5 - angle)
      const pts = Math.max(0, Math.round(60 - err * 80))
      scoreRef.current += pts
      setScore(scoreRef.current)
      dartsRef.current += 1
      setDarts(dartsRef.current)
      if (dartsRef.current >= 3) onFinish(scoreRef.current)
      else {
        t.current = 0
        setStage('power')
      }
    }
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <button onClick={tap} className="w-full">
      <GameFrame score={score} label={`${stage} · dardo ${darts + 1}/3`}>
        <canvas ref={canvas} className="block w-full" />
      </GameFrame>
    </button>
  )
}

export function Penalty({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rng = useRef(mulberry32(seed))
  const [shot, setShot] = useState(0)
  const [goals, setGoals] = useState(0)
  const [keeper, setKeeper] = useState(1)
  const [aim, setAim] = useState(1)
  const [msg, setMsg] = useState('Elige esquina y dispara')

  function shoot() {
    if (shot >= 5 || left > 0) return
    const dive = randInt(rng.current, 0, 2)
    setKeeper(dive)
    const ok = aim !== dive
    const g = goals + (ok ? 1 : 0)
    setGoals(g)
    setMsg(ok ? '¡Gol!' : 'Parada')
    const n = shot + 1
    setShot(n)
    if (n >= 5) onFinish(g)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={`${goals}/5`} label={`tiro ${Math.min(shot + 1, 5)}`}>
      <div className="space-y-3 p-4">
        <div className="relative h-40 overflow-hidden rounded-2xl bg-green-800">
          <div className="absolute inset-x-6 top-4 h-20 rounded-b-xl border-4 border-white/80" />
          <div
            className="absolute top-10 text-3xl transition-all"
            style={{ left: `${18 + keeper * 28}%` }}
          >
            🧤
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Izq', 'Centro', 'Der'].map((label, i) => (
            <button
              key={label}
              onClick={() => setAim(i)}
              className={`rounded-2xl py-3 font-bold ${aim === i ? 'bg-lime text-ink' : 'bg-card'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="btn btn-pink w-full" onClick={shoot} disabled={shot >= 5}>
          Disparar
        </button>
        <p className="text-center text-white/60">{msg}</p>
      </div>
    </GameFrame>
  )
}
