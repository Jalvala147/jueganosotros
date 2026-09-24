import { useEffect, useRef, useState } from 'react'
import { mulberry32, randInt } from '../lib/rng'
import { GameFrame, Overlay, useCanvas, useCountdown, type GameProps } from './kit'

export function Whack({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [score, setScore] = useState(0)
  const [holes, setHoles] = useState<('mole' | 'bomb' | null)[]>(Array(9).fill(null))
  const [time, setTime] = useState(45)
  const scoreRef = useRef(0)
  const live = left <= 0 && time > 0

  useEffect(() => {
    if (!live) return
    const rng = mulberry32(seed + 9)
    const pop = () => {
      const next = Array(9).fill(null) as ('mole' | 'bomb' | null)[]
      const n = 1 + Math.floor(rng() * 3)
      for (let i = 0; i < n; i++) {
        next[randInt(rng, 0, 8)] = rng() > 0.18 ? 'mole' : 'bomb'
      }
      setHoles(next)
    }
    pop()
    const iv = window.setInterval(pop, 700)
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

  function hit(i: number) {
    if (!live) return
    const cell = holes[i]
    if (!cell) return
    const next = [...holes]
    next[i] = null
    setHoles(next)
    scoreRef.current += cell === 'mole' ? 1 : -2
    setScore(scoreRef.current)
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label={`${time}s`}>
      <div className="grid touch-none grid-cols-3 gap-2 p-3">
        {holes.map((h, i) => (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              hit(i)
            }}
            className="flex aspect-square items-center justify-center rounded-2xl bg-[#15192c] text-4xl"
          >
            {h === 'mole' ? '🐹' : h === 'bomb' ? '💣' : ''}
          </button>
        ))}
      </div>
    </GameFrame>
  )
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tilt: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.max(-0.7, Math.min(1, tilt)))
  ctx.fillStyle = '#ffd145'
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 1.15, r * 0.88, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = Math.max(3, r * 0.14)
  ctx.strokeStyle = '#1c1430'
  ctx.stroke()
  ctx.fillStyle = '#ff4571'
  ctx.beginPath()
  ctx.moveTo(r * 0.55, -r * 0.08)
  ctx.lineTo(r * 1.35, r * 0.12)
  ctx.lineTo(r * 0.55, r * 0.32)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(r * 0.28, -r * 0.2, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1c1430'
  ctx.beginPath()
  ctx.arc(r * 0.36, -r * 0.2, r * 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function Flappy({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(460)
  const [score, setScore] = useState(0)
  const flapRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    let y = 0.46
    let v = 0
    let pace = 0.0044
    let started = false
    let dead = false
    let points = 0
    let endAt = 0
    let last = performance.now()
    const pipes: { x: number; gap: number; scored: boolean }[] = []
    for (let i = 0; i < 4; i++) pipes.push({ x: 1.25 + i * 0.78, gap: 0.36 + rng() * 0.28, scored: false })
    flapRef.current = () => {
      if (dead) return
      started = true
      v = -0.014
    }
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(1.8, (now - last) / 16.67)
      last = now
      const w = c.width
      const h = c.height
      if (w < 40 || h < 40) {
        raf = requestAnimationFrame(loop)
        return
      }
      ctx.fillStyle = '#8ee7ff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#d8f8ff'
      ctx.fillRect(0, h * 0.72, w, h * 0.28)
      if (!started) y = 0.46 + Math.sin(now / 260) * 0.015
      else if (!dead) {
        v = Math.min(0.022, v + 0.00062 * dt)
        y += v * dt
      }
      const pipeW = w * 0.16
      const gapHalf = 0.17
      const birdR = Math.min(w, h) * 0.048
      const birdX = w * 0.28
      const birdY = y * h
      if (started && !dead) pace = Math.min(0.0058, pace + 0.00000055 * dt)
      for (const p of pipes) {
        if (started && !dead) p.x -= pace * dt
        if (p.x < -0.35) {
          p.x = Math.max(...pipes.map((q) => q.x)) + 0.78
          p.gap = 0.3 + rng() * 0.4
          p.scored = false
        }
        const gx = p.x * w
        const gapTop = (p.gap - gapHalf) * h
        const gapBot = (p.gap + gapHalf) * h
        const lip = Math.max(8, pipeW * 0.22)
        ctx.fillStyle = '#7cff6b'
        ctx.fillRect(gx, 0, pipeW, Math.max(0, gapTop))
        ctx.fillRect(gx, gapBot, pipeW, Math.max(0, h - gapBot))
        ctx.fillStyle = '#1c1430'
        ctx.fillRect(gx - lip * 0.35, Math.max(0, gapTop - lip), pipeW + lip * 0.7, lip)
        ctx.fillRect(gx - lip * 0.35, gapBot, pipeW + lip * 0.7, lip)
        const overlaps = birdX + birdR > gx && birdX - birdR < gx + pipeW
        if (started && overlaps && (birdY - birdR * 0.7 < gapTop || birdY + birdR * 0.7 > gapBot)) dead = true
        if (started && !p.scored && gx + pipeW < birdX - birdR) {
          p.scored = true
          points += 1
          pace = Math.min(0.0058, pace + 0.00005)
          setScore(points)
        }
      }
      ctx.fillStyle = '#166534'
      ctx.fillRect(0, h - Math.max(10, h * 0.035), w, Math.max(10, h * 0.035))
      if (started && (birdY + birdR > h - h * 0.035 || birdY - birdR < 0)) dead = true
      drawBird(ctx, birdX, birdY, birdR, started ? v * 40 : 0)
      if (!started) {
        ctx.fillStyle = '#1c1430'
        ctx.font = `700 ${Math.round(Math.min(w, h) * 0.055)}px Fredoka, Nunito, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Toca para volar', w / 2, h * 0.2)
      }
      if (dead) {
        if (!endAt) endAt = now + 420
        if (now >= endAt) {
          onFinish(points)
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="toca para volar">
      <canvas
        ref={canvas}
        className="block w-full touch-none"
        onPointerDown={(e) => {
          e.preventDefault()
          flapRef.current()
        }}
      />
    </GameFrame>
  )
}

export function Snake({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [cells, setCells] = useState<{ x: number; y: number }[]>([{ x: 5, y: 5 }])
  const [food, setFood] = useState({ x: 8, y: 3 })
  const [score, setScore] = useState(0)
  const dir = useRef({ x: 1, y: 0 })
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const scoreRef = useRef(0)
  const done = useRef(false)
  const foodRef = useRef(food)
  const bodyRef = useRef(cells)

  useEffect(() => {
    if (left > 0) return
    const rng = mulberry32(seed)
    const place = (body: { x: number; y: number }[]) => {
      let f = { x: randInt(rng, 0, 11), y: randInt(rng, 0, 11) }
      let guard = 0
      while (body.some((b) => b.x === f.x && b.y === f.y) && guard < 40) {
        f = { x: randInt(rng, 0, 11), y: randInt(rng, 0, 11) }
        guard += 1
      }
      return f
    }
    const start = [{ x: 5, y: 5 }]
    const first = place(start)
    bodyRef.current = start
    foodRef.current = first
    setCells(start)
    setFood(first)
    const iv = window.setInterval(() => {
      if (done.current) return
      const body = bodyRef.current
      const head = { x: body[0]!.x + dir.current.x, y: body[0]!.y + dir.current.y }
      const meal = foodRef.current
      const eating = head.x === meal.x && head.y === meal.y
      const hitsSelf = body.some((part, i) => part.x === head.x && part.y === head.y && (eating || i < body.length - 1))
      if (head.x < 0 || head.y < 0 || head.x > 11 || head.y > 11 || hitsSelf) {
        done.current = true
        onFinish(scoreRef.current)
        return
      }
      const next = [head, ...body]
      if (eating) {
        scoreRef.current += 1
        setScore(scoreRef.current)
        const placed = place(next)
        foodRef.current = placed
        setFood(placed)
      } else next.pop()
      bodyRef.current = next
      setCells(next)
    }, 160)
    return () => window.clearInterval(iv)
  }, [left, onFinish, seed])

  function swipe(dx: number, dy: number) {
    if (dir.current.x + dx === 0 && dir.current.y + dy === 0) return
    dir.current = { x: dx, y: dy }
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="desliza o usa las flechas">
      <div
        className="grid touch-none grid-cols-12 gap-0.5 p-2"
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
          if (Math.hypot(dx, dy) < 20) return
          if (Math.abs(dx) > Math.abs(dy)) swipe(dx > 0 ? 1 : -1, 0)
          else swipe(0, dy > 0 ? 1 : -1)
        }}
      >
        {Array.from({ length: 144 }, (_, i) => {
          const x = i % 12
          const y = Math.floor(i / 12)
          const snake = cells.some((c) => c.x === x && c.y === y)
          const isFood = food.x === x && food.y === y
          return (
            <div
              key={i}
              className={`aspect-square rounded-sm ${snake ? 'bg-lime' : isFood ? 'bg-pink' : 'bg-[#15192c]'}`}
            />
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        <span />
        <button type="button" className="btn btn-yellow min-h-14" onPointerDown={(e) => { e.preventDefault(); swipe(0, -1) }}>↑</button>
        <span />
        <button type="button" className="btn btn-yellow min-h-14" onPointerDown={(e) => { e.preventDefault(); swipe(-1, 0) }}>←</button>
        <span />
        <button type="button" className="btn btn-yellow min-h-14" onPointerDown={(e) => { e.preventDefault(); swipe(1, 0) }}>→</button>
        <span />
        <button type="button" className="btn btn-yellow min-h-14" onPointerDown={(e) => { e.preventDefault(); swipe(0, 1) }}>↓</button>
        <span />
      </div>
    </GameFrame>
  )
}

export function Crossy({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(480)
  const [score, setScore] = useState(0)
  const stepRef = useRef<(side: number, forward: number) => void>(() => {})

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    type Lane = { safe: boolean; dir: number; speed: number; cars: number[]; color: string }
    const lanes = new Map<number, Lane>()
    const laneAt = (index: number) => {
      const found = lanes.get(index)
      if (found) return found
      const rng = mulberry32((seed ^ Math.imul(index + 31, 0x9e3779b1)) >>> 0)
      const safe = index <= 0 || index % 3 === 0
      const lane: Lane = {
        safe,
        dir: rng() > 0.5 ? 1 : -1,
        speed: 0.0024 + Math.min(0.0022, Math.max(0, index) * 0.00006) + rng() * 0.0011,
        cars: [],
        color: rng() > 0.5 ? '#ff4571' : '#7eb6ff',
      }
      if (!safe) {
        const first = rng() * 0.4
        lane.cars.push(first)
        if (rng() > 0.25) lane.cars.push(first + 0.58)
      }
      lanes.set(index, lane)
      return lane
    }
    let px = 0.5
    let playerRow = 0
    let dead = false
    let endAt = 0
    let tick = 0
    const step = (side: number, forward: number) => {
      if (dead) return
      if (side) px = Math.min(0.86, Math.max(0.14, px + side * 0.2))
      if (forward > 0) {
        playerRow += 1
        setScore(playerRow)
      } else if (forward < 0 && playerRow > 0) playerRow -= 1
    }
    stepRef.current = step
    let sx = 0
    let sy = 0
    let pointing = false
    const down = (e: PointerEvent) => {
      e.preventDefault()
      pointing = true
      sx = e.clientX
      sy = e.clientY
      c.setPointerCapture?.(e.pointerId)
    }
    const up = (e: PointerEvent) => {
      if (!pointing) return
      pointing = false
      e.preventDefault()
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (Math.hypot(dx, dy) < 36) step(0, 1)
      else if (Math.abs(dx) > Math.abs(dy)) step(dx > 0 ? 1 : -1, 0)
      else step(0, dy > 0 ? -1 : 1)
    }
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointerup', up)
    c.addEventListener('pointercancel', up)
    let raf = 0
    const loop = () => {
      const w = c.width
      const h = c.height
      if (w < 40 || h < 40) {
        raf = requestAnimationFrame(loop)
        return
      }
      const rowH = h * 0.12
      const playerY = h * 0.7
      if (!dead) tick += 1
      ctx.fillStyle = '#14301c'
      ctx.fillRect(0, 0, w, h)
      const playerR = Math.min(w, h) * 0.032
      const playerCx = px * w
      const playerCy = playerY + rowH * 0.5
      for (let i = playerRow - 4; i <= playerRow + 8; i++) {
        const lane = laneAt(i)
        const y = playerY - (i - playerRow) * rowH
        if (y > h + rowH || y + rowH < -rowH) continue
        ctx.fillStyle = lane.safe ? '#3cb85a' : '#2a3148'
        ctx.fillRect(0, y, w, rowH - 3)
        if (!lane.safe) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'
          ctx.setLineDash([w * 0.04, w * 0.05])
          ctx.lineWidth = Math.max(2, h * 0.004)
          ctx.beginPath()
          ctx.moveTo(0, y + rowH * 0.5)
          ctx.lineTo(w, y + rowH * 0.5)
          ctx.stroke()
          ctx.setLineDash([])
        }
        const carW = w * 0.18
        const carH = rowH * 0.46
        for (const origin of lane.cars) {
          const span = 1.28
          const shift = tick * lane.speed * lane.dir
          const leftN = ((origin + shift) % span + span) % span - 0.2
          const carX = leftN * w
          const carY = y + (rowH - carH) / 2
          ctx.fillStyle = lane.color
          ctx.beginPath()
          ctx.roundRect(carX, carY, carW, carH, 8)
          ctx.fill()
          ctx.strokeStyle = '#1c1430'
          ctx.lineWidth = 3
          ctx.stroke()
          if (!dead && i === playerRow) {
            const hit =
              carX < playerCx + playerR * 0.65 &&
              carX + carW > playerCx - playerR * 0.65 &&
              carY < playerCy + playerR * 0.65 &&
              carY + carH > playerCy - playerR * 0.65
            if (hit) dead = true
          }
        }
      }
      ctx.fillStyle = '#ffd145'
      ctx.beginPath()
      ctx.arc(playerCx, playerCy, playerR, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = Math.max(3, playerR * 0.18)
      ctx.strokeStyle = '#1c1430'
      ctx.stroke()
      ctx.fillStyle = '#1c1430'
      ctx.beginPath()
      ctx.arc(playerCx + playerR * 0.28, playerCy - playerR * 0.15, playerR * 0.16, 0, Math.PI * 2)
      ctx.fill()
      if (dead) {
        ctx.fillStyle = '#ff4571'
        ctx.font = `700 ${Math.round(h * 0.06)}px Fredoka, Nunito, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Te atropellaron', w / 2, h * 0.16)
        if (!endAt) endAt = performance.now() + 500
        if (performance.now() >= endAt) {
          onFinish(playerRow)
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', down)
      c.removeEventListener('pointerup', up)
      c.removeEventListener('pointercancel', up)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="toca para subir">
      <canvas ref={canvas} className="block w-full touch-none" />
    </GameFrame>
  )
}

export function ColorSwitch({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [score, setScore] = useState(0)
  const [color, setColor] = useState(0)
  const colors = ['#ff4d8d', '#c8f542', '#3de0ff', '#fbbf24']
  const colorRef = useRef(0)
  const canvas = useCanvas(440)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    let gate = 0
    let barY = -0.35
    let speed = 0.0028
    let armed = true
    let points = 0
    let alive = true
    const nextGate = () => {
      gate = randInt(rng, 0, 3)
      barY = -0.28
      armed = true
      speed = Math.min(0.008, 0.0028 + points * 0.00035)
    }
    nextGate()
    let raf = 0
    const loop = () => {
      if (!alive) return
      barY += speed
      const w = c.width
      const h = c.height
      const playerY = 0.72
      ctx.imageSmoothingEnabled = true
      ctx.fillStyle = '#070814'
      ctx.fillRect(0, 0, w, h)
      const barH = Math.max(h * 0.07, 28)
      const barW = w * 0.72
      const barX = (w - barW) / 2
      const gy = barY * h - barH / 2
      ctx.fillStyle = colors[gate]!
      ctx.beginPath()
      ctx.roundRect(barX, gy, barW, barH, barH / 2)
      ctx.fill()
      ctx.lineWidth = Math.max(4, barH * 0.12)
      ctx.strokeStyle = '#1c1430'
      ctx.stroke()
      const r = Math.min(w, h) * 0.09
      const bx = w / 2
      const by = playerY * h
      const glow = ctx.createRadialGradient(bx - r * 0.32, by - r * 0.38, r * 0.05, bx, by, r)
      glow.addColorStop(0, '#ffffff')
      glow.addColorStop(0.28, colors[colorRef.current]!)
      glow.addColorStop(1, '#1c1430')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(bx, by, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = Math.max(4, r * 0.1)
      ctx.strokeStyle = '#1c1430'
      ctx.stroke()
      const reach = (barH / 2 + r * 0.72) / h
      if (armed && Math.abs(barY - playerY) < reach) {
        armed = false
        if (colorRef.current !== gate) {
          alive = false
          onFinish(points)
          return
        }
        points += 1
        setScore(points)
      }
      if (barY > 1.15) nextGate()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="iguala el color de la barra">
      <canvas
        ref={canvas}
        className="block w-full touch-none"
        onPointerDown={(e) => {
          e.preventDefault()
          colorRef.current = (colorRef.current + 1) % 4
          setColor(colorRef.current)
        }}
      />
      <div className="flex justify-center gap-2 px-3 pb-3">
        {colors.map((hex, i) => (
          <span
            key={hex}
            className="h-6 w-6 rounded-full"
            style={{ background: hex, outline: i === color ? '3px solid #1c1430' : 'none' }}
          />
        ))}
      </div>
    </GameFrame>
  )
}

export function Piano({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(520)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    const cols: number[] = []
    const colAt = (i: number) => {
      while (cols.length <= i) {
        let next = randInt(rng, 0, 3)
        if (next === cols[cols.length - 1]) next = (next + 1 + randInt(rng, 0, 2)) % 4
        cols.push(next)
      }
      return cols[i]!
    }
    let scroll = 2.2
    let nextIndex = 0
    let speed = 0.015
    let points = 0
    let dead = false
    let endAt = 0
    const hit = new Set<number>()
    let last = performance.now()
    const tap = (e: PointerEvent) => {
      e.preventDefault()
      if (dead) return
      const rect = c.getBoundingClientRect()
      const w = c.width
      const h = c.height
      if (w < 40 || h < 40) return
      const x = (e.clientX - rect.left) / rect.width
      const yPx = ((e.clientY - rect.top) / rect.height) * h
      const col = Math.min(3, Math.max(0, Math.floor(x * 4)))
      const tileH = h / 4.15
      const row = Math.floor(scroll - (h - yPx) / tileH)
      if (row < 0 || hit.has(row)) return
      const top = h - (scroll - row) * tileH
      if (yPx < top || yPx > top + tileH) return
      if (row !== nextIndex || col !== colAt(row)) {
        dead = true
        return
      }
      hit.add(row)
      nextIndex += 1
      points += 1
      setScore(points)
      speed = Math.min(0.032, speed + 0.00045)
    }
    c.addEventListener('pointerdown', tap)
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(1.8, (now - last) / 16.67)
      last = now
      const w = c.width
      const h = c.height
      if (w < 40 || h < 40) {
        raf = requestAnimationFrame(loop)
        return
      }
      if (!dead) scroll += speed * dt
      const tileH = h / 4.15
      const needTop = h - (scroll - nextIndex) * tileH
      if (!dead && needTop + tileH < 0) dead = true
      ctx.fillStyle = '#fff8ee'
      ctx.fillRect(0, 0, w, h)
      const from = Math.max(0, Math.floor(scroll) - 6)
      for (let i = from; i < scroll + 7; i++) {
        const top = h - (scroll - i) * tileH
        if (top > h || top + tileH < 0) continue
        const black = colAt(i)
        for (let lane = 0; lane < 4; lane++) {
          const tapped = hit.has(i)
          ctx.fillStyle = lane === black ? (tapped ? '#8260f6' : '#1c1430') : '#fff8ee'
          ctx.fillRect(lane * (w / 4) + 3, top + 3, w / 4 - 6, tileH - 6)
          ctx.strokeStyle = '#1c1430'
          ctx.lineWidth = Math.max(2, w * 0.006)
          ctx.strokeRect(lane * (w / 4) + 3, top + 3, w / 4 - 6, tileH - 6)
        }
      }
      ctx.strokeStyle = '#ff4571'
      ctx.lineWidth = Math.max(4, h * 0.012)
      ctx.beginPath()
      ctx.moveTo(0, 8)
      ctx.lineTo(w, 8)
      ctx.stroke()
      if (dead) {
        if (!endAt) endAt = now + 280
        if (now >= endAt) {
          onFinish(points)
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', tap)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="toca la negra de arriba">
      <canvas ref={canvas} className="block w-full touch-none" />
    </GameFrame>
  )
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, brick: boolean) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.fillStyle = brick ? '#e7d3c4' : '#d5dbe3'
  ctx.fillRect(x, y, w, h)
  const bw = w / (brick ? 4 : 2.2)
  const bh = Math.max(8, h / 3.2)
  ctx.fillStyle = brick ? '#c4563a' : '#8d98a6'
  for (let row = 0; row * bh < h + bh; row++) {
    const offset = row % 2 ? bw / 2 : 0
    for (let col = -1; (offset + col * bw) < w + bw; col++) {
      ctx.fillRect(x + offset + col * bw + 1.5, y + row * bh + 1.5, bw - 3, bh - 3)
    }
  }
  ctx.restore()
  ctx.strokeStyle = '#1c1430'
  ctx.lineWidth = Math.max(3, w * 0.035)
  ctx.strokeRect(x, y, w, h)
}

export function LaneRace({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(480)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    const gap = 0.58
    let lane = 1
    let speed = 0.0034
    let distance = 0
    let dead = false
    let endAt = 0
    let last = performance.now()
    let shown = 0
    const pattern = (tough: boolean) => {
      const free = randInt(rng, 0, 2)
      if (!tough || rng() < 0.45) return [randInt(rng, 0, 2)]
      return [0, 1, 2].filter((n) => n !== free)
    }
    const rows: { y: number; lanes: number[] }[] = []
    for (let i = 0; i < 6; i++) rows.push({ y: 0.22 - i * gap, lanes: pattern(false) })
    const pickLane = (e: PointerEvent) => {
      e.preventDefault()
      if (dead) return
      const rect = c.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      lane = x < 1 / 3 ? 0 : x > 2 / 3 ? 2 : 1
    }
    c.addEventListener('pointerdown', pickLane)
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(1.8, (now - last) / 16.67)
      last = now
      const w = c.width
      const h = c.height
      if (w < 40 || h < 40) {
        raf = requestAnimationFrame(loop)
        return
      }
      if (!dead) {
        speed = Math.min(0.0072, speed + 0.0000016 * dt)
        distance += speed * dt
        if (Math.floor(distance * 40) !== shown) {
          shown = Math.floor(distance * 40)
          setScore(shown)
        }
        for (const row of rows) row.y += speed * dt
        let cursor = Math.min(...rows.map((row) => row.y))
        for (const row of rows) {
          if (row.y > 1.25) {
            cursor -= gap
            row.y = cursor
            row.lanes = pattern(distance > 6)
          }
        }
      }
      ctx.fillStyle = '#166534'
      ctx.fillRect(0, 0, w, h)
      const laneW = w / 3
      ctx.fillStyle = '#4b5563'
      ctx.fillRect(laneW * 0.08, 0, w - laneW * 0.16, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = Math.max(3, w * 0.008)
      ctx.setLineDash([h * 0.06, h * 0.05])
      ctx.beginPath()
      ctx.moveTo(laneW, 0)
      ctx.lineTo(laneW, h)
      ctx.moveTo(laneW * 2, 0)
      ctx.lineTo(laneW * 2, h)
      ctx.stroke()
      ctx.setLineDash([])
      const wallW = laneW * 0.78
      const wallH = Math.min(h * 0.11, laneW * 0.55)
      const playerTop = h * 0.78
      const playerH = Math.min(h * 0.12, laneW * 0.72)
      for (const row of rows) {
        for (const blocked of row.lanes) {
          const x = laneW * blocked + (laneW - wallW) / 2
          const y = row.y * h
          drawWall(ctx, x, y, wallW, wallH, blocked !== 1)
          const overlaps = y < playerTop + playerH * 0.82 && y + wallH > playerTop + playerH * 0.18
          if (!dead && overlaps && blocked === lane) dead = true
        }
      }
      ctx.save()
      ctx.translate(laneW * lane + laneW / 2, playerTop + playerH / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.font = `${Math.round(playerH)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🚗', 0, 0)
      ctx.restore()
      if (dead) {
        if (!endAt) endAt = now + 360
        if (now >= endAt) {
          onFinish(shown)
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', pickLane)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="toca el carril libre">
      <canvas ref={canvas} className="block w-full touch-none" />
    </GameFrame>
  )
}
