import { useEffect, useRef, useState } from 'react'
import { mulberry32 } from '../lib/rng'
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
    let missedAt = 0
    const drop = (e: PointerEvent) => {
      e.preventDefault()
      if (missedAt) return
      const leftEdge = Math.max(center - width / 2, x - width / 2)
      const rightEdge = Math.min(center + width / 2, x + width / 2)
      const overlap = rightEdge - leftEdge
      if (overlap < 0.04) {
        missedAt = performance.now()
        return
      }
      center = (leftEdge + rightEdge) / 2
      width = overlap
      stack += 1
      scoreRef.current = stack
      x = rng() > 0.5 ? -0.1 : 1.1
      dir = x < 0 ? 1 : -1
    }
    c.addEventListener('pointerdown', drop)
    let raf = 0
    const loop = () => {
      const w = c.width
      const h = c.height
      const marginTop = h * 0.08
      const marginBottom = h * 0.05
      const step = Math.max(12, Math.round(h * 0.055))
      const blockH = Math.round(step * 0.86)
      const camera = Math.max(0, marginTop - (h - marginBottom - (stack + 1) * step))
      const yAt = (level: number) => h - marginBottom - (level + 1) * step + camera
      ctx.fillStyle = '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      if (!missedAt) {
        x += dir * (0.008 + stack * 0.0004)
        if (x > 1.15 || x < -0.15) dir *= -1
      }
      for (let i = 0; i < stack; i++) {
        const y = yAt(i)
        if (y > h || y + blockH < 0) continue
        ctx.fillStyle = i % 2 ? '#c8f542' : '#3de0ff'
        ctx.fillRect((center - width / 2) * w, y, width * w, blockH)
      }
      ctx.fillStyle = '#ff4d8d'
      const movingY = yAt(stack)
      ctx.fillRect((x - width / 2) * w, movingY, width * w, blockH)
      if (missedAt) {
        if (stack > 0) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 3
          ctx.strokeRect((center - width / 2) * w, yAt(stack - 1), width * w, blockH)
        }
        ctx.fillStyle = '#fff'
        ctx.font = `700 ${Math.round(h * 0.06)}px Nunito, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Fallaste', w / 2, marginTop + h * 0.08)
        if (performance.now() - missedAt >= 1500) {
          onFinish(stack)
          return
        }
      }
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

function drawKnife(ctx: CanvasRenderingContext2D, len: number, thick: number, stuck: boolean) {
  ctx.fillStyle = stuck ? '#d7dee6' : '#f4f7fb'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(thick, len * 0.62)
  ctx.lineTo(0, len * 0.74)
  ctx.lineTo(-thick, len * 0.62)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#1c1430'
  ctx.lineWidth = Math.max(2, thick * 0.35)
  ctx.stroke()
  ctx.fillStyle = '#1c1430'
  ctx.beginPath()
  ctx.roundRect(-thick * 0.85, len * 0.7, thick * 1.7, len * 0.28, thick * 0.4)
  ctx.fill()
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
    let angle = rng() * Math.PI * 2
    let speed = 0.018 + rng() * 0.006
    let dead = false
    let points = 0
    let last = performance.now()
    let flight: { from: number; to: number; p: number; angle: number; ok: boolean } | null = null
    let miss = 0
    let endAt = 0
    const gap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
    const throwK = (e: PointerEvent) => {
      e.preventDefault()
      if (dead || flight) return
      const local = -angle
      const ok = !stuck.some((s) => gap(s, local) < 0.26)
      flight = { from: 1, to: 0, p: 0, angle: local, ok }
    }
    c.addEventListener('pointerdown', throwK)
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(2, (now - last) / 16.67)
      last = now
      const w = c.width
      const h = c.height
      const fit = Math.min(w, h)
      const logR = fit * 0.18
      const knifeLen = fit * 0.2
      const knifeT = fit * 0.018
      const cy = h * 0.4
      if (!dead) angle += speed * dt
      if (flight) {
        flight.p = Math.min(1, flight.p + 0.16 * dt)
        if (flight.p >= 1) {
          if (flight.ok) {
            stuck.push(flight.angle)
            points += 1
            setScore(points)
            speed += 0.0015
          } else {
            dead = true
            miss = 0.01
            endAt = now + 700
          }
          flight = null
        }
      }
      if (miss > 0) miss = Math.min(1, miss + 0.08 * dt)
      ctx.fillStyle = '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, cy)
      ctx.rotate(angle)
      const wood = ctx.createRadialGradient(-logR * 0.2, -logR * 0.2, logR * 0.2, 0, 0, logR)
      wood.addColorStop(0, '#e0b072')
      wood.addColorStop(0.55, '#c68642')
      wood.addColorStop(1, '#8d5524')
      ctx.fillStyle = wood
      ctx.beginPath()
      ctx.arc(0, 0, logR, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1c1430'
      ctx.lineWidth = Math.max(3, fit * 0.008)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(80, 42, 16, 0.45)'
      ctx.lineWidth = Math.max(2, fit * 0.006)
      ctx.beginPath()
      ctx.arc(0, 0, logR * 0.62, 0, Math.PI * 2)
      ctx.stroke()
      for (const s of stuck) {
        ctx.save()
        ctx.rotate(s)
        ctx.translate(0, logR * 0.78)
        drawKnife(ctx, knifeLen, knifeT, true)
        ctx.restore()
      }
      ctx.restore()
      ctx.fillStyle = '#fff8ee'
      ctx.beginPath()
      ctx.arc(w / 2, cy + logR, Math.max(5, fit * 0.012), 0, Math.PI * 2)
      ctx.fill()
      const launchY = Math.min(h * 0.78, h - knifeLen - 12)
      const stickY = cy + logR * 0.78
      if (!dead) {
        const knifeY = flight ? launchY + (stickY - launchY) * flight.p : launchY + Math.sin(now / 180) * fit * 0.008
        ctx.save()
        ctx.translate(w / 2, knifeY)
        if (flight && !flight.ok && flight.p > 0.82) ctx.rotate(0.5)
        drawKnife(ctx, knifeLen, knifeT, false)
        ctx.restore()
      } else if (miss > 0) {
        ctx.save()
        ctx.translate(w / 2 + miss * fit * 0.08, stickY + miss * fit * 0.12)
        ctx.rotate(0.4 + miss * 1.2)
        drawKnife(ctx, knifeLen, knifeT, false)
        ctx.restore()
        ctx.fillStyle = '#ff4d8d'
        ctx.font = `700 ${Math.round(fit * 0.07)}px Fredoka, Nunito, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('¡Choque!', w / 2, h * 0.18)
      }
      if (dead && now >= endAt) {
        onFinish(points)
        return
      }
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
    <GameFrame score={score} label="toca para lanzar">
      <canvas ref={canvas} className="block w-full touch-none" />
    </GameFrame>
  )
}

export function Darts({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(430)
  const [score, setScore] = useState(0)
  const [thrown, setThrown] = useState(0)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const marks: { y: number; pts: number }[] = []
    let swing = ((seed % 17) / 17) * Math.PI * 2
    let flying: { y: number; p: number; pts: number } | null = null
    let thrownCount = 0
    let total = 0
    let doneAt = 0
    let note = ''
    let noteUntil = 0
    const shoot = (e: PointerEvent) => {
      e.preventDefault()
      if (flying || thrownCount >= 3) return
      const w = c.width
      const h = c.height
      const outer = Math.min(w, h) * 0.2
      const cy = h * 0.46
      const y = cy + Math.sin(swing) * Math.min(w, h) * 0.38
      const pts = pointsFor(y, cy, outer)
      total += pts
      thrownCount += 1
      setScore(total)
      setThrown(thrownCount)
      note = pts ? `+${pts}` : 'Fuera'
      noteUntil = performance.now() + 700
      flying = { y: y / h, p: 0, pts }
    }
    const pointsFor = (y: number, cy: number, outer: number) => {
      const dist = Math.abs(y - cy)
      if (dist <= outer * 0.16) return 50
      if (dist <= outer * 0.48) return 25
      if (dist <= outer) return 10
      return 0
    }
    c.addEventListener('pointerdown', shoot)
    let raf = 0
    const loop = () => {
      if (!flying) swing += 0.028
      const w = c.width
      const h = c.height
      const outer = Math.min(w, h) * 0.2
      const cx = w * 0.62
      const cy = h * 0.46
      const arrowHome = w * 0.16
      ctx.fillStyle = '#12331c'
      ctx.fillRect(0, 0, w, h)
      const rings: { color: string; scale: number }[] = [
        { color: '#1c1430', scale: 1 },
        { color: '#f8fafc', scale: 0.78 },
        { color: '#ff4d8d', scale: 0.48 },
        { color: '#ffd145', scale: 0.16 },
      ]
      for (const ring of rings) {
        ctx.fillStyle = ring.color
        ctx.beginPath()
        ctx.arc(cx, cy, outer * ring.scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = Math.max(3, outer * 0.02)
        ctx.strokeStyle = '#1c1430'
        ctx.stroke()
      }
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1c1430'
      ctx.font = `700 ${Math.round(outer * 0.14)}px Fredoka, Nunito, sans-serif`
      ctx.fillText('50', cx, cy)
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${Math.round(outer * 0.1)}px Fredoka, Nunito, sans-serif`
      ctx.fillText('25', cx, cy - outer * 0.32)
      ctx.fillStyle = '#1c1430'
      ctx.fillText('10', cx, cy - outer * 0.64)
      for (const mark of marks) {
        ctx.fillStyle = mark.pts ? '#ff4571' : '#94a3b8'
        ctx.beginPath()
        ctx.arc(cx, mark.y * h, Math.max(6, outer * 0.045), 0, Math.PI * 2)
        ctx.fill()
      }
      const arrowY = flying ? flying.y * h : cy + Math.sin(swing) * Math.min(w, h) * 0.38
      const arrowX = flying ? arrowHome + (cx - arrowHome) * flying.p : arrowHome
      ctx.save()
      ctx.translate(arrowX, arrowY)
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.moveTo(outer * 0.22, 0)
      ctx.lineTo(-outer * 0.02, outer * 0.07)
      ctx.lineTo(-outer * 0.02, -outer * 0.07)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#ff4d8d'
      ctx.lineWidth = Math.max(4, outer * 0.04)
      ctx.beginPath()
      ctx.moveTo(-outer * 0.02, 0)
      ctx.lineTo(-outer * 0.28, 0)
      ctx.stroke()
      ctx.restore()
      if (performance.now() < noteUntil) {
        ctx.fillStyle = '#ffd145'
        ctx.font = `700 ${Math.round(h * 0.07)}px Fredoka, Nunito, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(note, w / 2, h * 0.12)
      }
      if (flying) {
        flying.p += 0.08
        if (flying.p >= 1) {
          marks.push({ y: flying.y, pts: flying.pts })
          flying = null
          if (thrownCount >= 3) doneAt = performance.now() + 550
        }
      }
      if (doneAt && performance.now() >= doneAt) {
        onFinish(total)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', shoot)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={`dardo ${Math.min(thrown + 1, 3)} de 3`}>
      <canvas ref={canvas} className="block w-full touch-none" />
      <p className="px-4 py-3 text-center text-sm font-extrabold leading-relaxed break-words text-ink/70">
        La flecha sube y baja. Toca para dispararla hacia la diana.
      </p>
    </GameFrame>
  )
}

export function Penalty({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(460)
  const [goals, setGoals] = useState(0)
  const [shot, setShot] = useState(0)
  const [msg, setMsg] = useState('Toca la portería')

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    let keeper = 0.35 + rng() * 0.15
    let dir = rng() > 0.5 ? 1 : -1
    const speed = 0.008 + rng() * 0.003
    let goalsCount = 0
    let shots = 0
    let ball: { x: number; y: number; p: number } | null = null
    let lock = false
    let note = ''
    let resumeAt = 0
    let pendingFinish = false
    const shoot = (e: PointerEvent) => {
      e.preventDefault()
      if (lock || shots >= 5) return
      const rect = c.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      if (nx < 0.1 || nx > 0.9 || ny < 0.08 || ny > 0.5) return
      ball = { x: nx, y: ny, p: 0 }
      lock = true
    }
    c.addEventListener('pointerdown', shoot)
    let raf = 0
    const loop = () => {
      const now = performance.now()
      keeper += dir * speed
      if (keeper > 0.8) {
        keeper = 0.8
        dir = -1
      } else if (keeper < 0.2) {
        keeper = 0.2
        dir = 1
      }
      const w = c.width
      const h = c.height
      ctx.fillStyle = '#166534'
      ctx.fillRect(0, 0, w, h)
      const gx = w * 0.1
      const gy = h * 0.08
      const gw = w * 0.8
      const gh = h * 0.42
      ctx.strokeStyle = '#f8fafc'
      ctx.lineWidth = Math.max(4, w * 0.012)
      ctx.strokeRect(gx, gy, gw, gh)
      ctx.globalAlpha = 0.35
      for (let i = 1; i < 6; i++) {
        ctx.beginPath()
        ctx.moveTo(gx + (gw * i) / 6, gy)
        ctx.lineTo(gx + (gw * i) / 6, gy + gh)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      const kw = w * 0.18
      const kh = gh * 0.78
      const kx = keeper * w - kw / 2
      const ky = gy + gh * 0.16
      ctx.fillStyle = '#ffd145'
      ctx.beginPath()
      ctx.roundRect(kx + kw * 0.22, ky + kh * 0.22, kw * 0.56, kh * 0.48, kw * 0.12)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(kx + kw / 2, ky + kh * 0.16, kw * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(kx, ky + kh * 0.34, kw * 0.22, kh * 0.16)
      ctx.fillRect(kx + kw * 0.78, ky + kh * 0.34, kw * 0.22, kh * 0.16)
      ctx.fillStyle = '#1c1430'
      ctx.fillRect(kx + kw * 0.28, ky + kh * 0.7, kw * 0.16, kh * 0.28)
      ctx.fillRect(kx + kw * 0.56, ky + kh * 0.7, kw * 0.16, kh * 0.28)
      const by = ball ? h * 0.86 + (ball.y * h - h * 0.86) * ball.p : h * 0.86
      const bx = ball ? w * 0.5 + (ball.x * w - w * 0.5) * ball.p : w * 0.5
      const br = Math.min(w, h) * (ball ? 0.05 - ball.p * 0.018 : 0.05)
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(bx, by, Math.max(6, br), 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1c1430'
      ctx.lineWidth = Math.max(3, br * 0.25)
      ctx.stroke()
      if (ball) {
        ball.p = Math.min(1, ball.p + 0.34)
        if (ball.p >= 1) {
          const saved = Math.abs(keeper - ball.x) < kw / w / 2
          if (!saved) goalsCount += 1
          shots += 1
          setGoals(goalsCount)
          setShot(shots)
          note = saved ? 'Atajada' : '¡Gol!'
          resumeAt = now + 480
          setMsg(`${note} · ${shots}/5`)
          pendingFinish = shots >= 5
          ball = null
        }
      } else if (lock && now >= resumeAt) {
        if (pendingFinish) {
          onFinish(goalsCount)
          return
        }
        lock = false
      }
      if (note && now < resumeAt) {
        ctx.fillStyle = note === '¡Gol!' ? '#ffd145' : '#fff'
        ctx.font = `700 ${Math.round(Math.min(w, h) * 0.09)}px Fredoka, Nunito, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(note, w / 2, h * 0.8)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', shoot)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={`${goals}/5`} label={shot >= 5 ? 'listo' : `tiro ${shot + 1} de 5`}>
      <canvas ref={canvas} className="block w-full touch-none" />
      <p className="px-4 py-3 text-center text-sm font-extrabold leading-relaxed break-words text-ink/70">{msg}</p>
    </GameFrame>
  )
}
