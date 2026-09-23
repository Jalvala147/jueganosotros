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
      <div className="grid grid-cols-3 gap-2 p-3">
        {holes.map((h, i) => (
          <button
            key={i}
            onClick={() => hit(i)}
            className="flex aspect-square items-center justify-center rounded-2xl bg-[#15192c] text-3xl"
          >
            {h === 'mole' ? '🐹' : h === 'bomb' ? '💣' : ''}
          </button>
        ))}
      </div>
    </GameFrame>
  )
}

export function Flappy({ seed, onFinish }: GameProps) {
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
    let y = 0.5
    let v = 0
    let dead = false
    const pipes: { x: number; gap: number }[] = []
    for (let i = 0; i < 8; i++) pipes.push({ x: 1.2 + i * 0.55, gap: 0.25 + rng() * 0.45 })
    const flap = () => {
      if (!dead) v = -0.012
    }
    c.addEventListener('pointerdown', flap)
    let raf = 0
    const loop = () => {
      const w = c.width
      const h = c.height
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)
      v += 0.00045
      y += v
      for (const p of pipes) {
        p.x -= 0.006
        const gx = p.x * w
        const gap = p.gap * h
        const gh = h * 0.22
        ctx.fillStyle = '#c8f542'
        ctx.fillRect(gx, 0, 36, gap - gh / 2)
        ctx.fillRect(gx, gap + gh / 2, 36, h)
        const birdY = y * h
        if (p.x < 0.28 && p.x > 0.18) {
          if (birdY < gap - gh / 2 || birdY > gap + gh / 2) dead = true
        }
        const pipe = p as { x: number; gap: number; scored?: boolean }
        if (!pipe.scored && pipe.x < 0.22) {
          pipe.scored = true
          scoreRef.current += 1
        }
      }
      if (y < 0 || y > 1) dead = true
      ctx.fillStyle = '#ff4d8d'
      ctx.beginPath()
      ctx.arc(w * 0.28, y * h, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `${20 * (w / 360)}px Outfit`
      ctx.fillText(String(Math.floor(scoreRef.current)), 20, 40)
      if (dead) {
        onFinish(Math.floor(scoreRef.current))
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', flap)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame label="un toque = aleteo">
      <canvas ref={canvas} className="block w-full" />
    </GameFrame>
  )
}

export function Snake({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const [cells, setCells] = useState<{ x: number; y: number }[]>([{ x: 5, y: 5 }])
  const [food, setFood] = useState({ x: 8, y: 3 })
  const dir = useRef({ x: 1, y: 0 })
  const scoreRef = useRef(0)
  const done = useRef(false)
  const foodRef = useRef(food)
  foodRef.current = food

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
    const first = place([{ x: 5, y: 5 }])
    foodRef.current = first
    setFood(first)
    const iv = window.setInterval(() => {
      setCells((body) => {
        if (done.current) return body
        const head = { x: body[0]!.x + dir.current.x, y: body[0]!.y + dir.current.y }
        const hitsSelf = body.slice(0, -1).some((b) => b.x === head.x && b.y === head.y)
        if (head.x < 0 || head.y < 0 || head.x > 11 || head.y > 11 || hitsSelf) {
          done.current = true
          onFinish(scoreRef.current)
          return body
        }
        const next = [head, ...body]
        const meal = foodRef.current
        if (head.x === meal.x && head.y === meal.y) {
          scoreRef.current += 1
          const placed = place(next)
          foodRef.current = placed
          setFood(placed)
        } else next.pop()
        return next
      })
    }, 160)
    return () => window.clearInterval(iv)
  }, [left, onFinish, seed])

  function swipe(dx: number, dy: number) {
    if (dir.current.x + dx === 0 && dir.current.y + dy === 0) return
    dir.current = { x: dx, y: dy }
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={scoreRef.current} label="desliza">
      <div
        className="grid grid-cols-12 gap-0.5 p-2"
        onPointerUp={(e) => {
          const t = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - t.left) / t.width - 0.5
          const y = (e.clientY - t.top) / t.height - 0.5
          if (Math.abs(x) > Math.abs(y)) swipe(x > 0 ? 1 : -1, 0)
          else swipe(0, y > 0 ? 1 : -1)
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
    </GameFrame>
  )
}

export function Crossy({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const canvas = useCanvas(480)
  const scoreRef = useRef(0)

  useEffect(() => {
    if (left > 0) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rng = mulberry32(seed)
    let px = 0.5
    let py = 0.9
    let dead = false
    let grace = 50
    const lanes = Array.from({ length: 8 }, (_, i) => ({
      y: 0.08 + i * 0.08,
      dir: rng() > 0.5 ? 1 : -1,
      speed: 0.003 + rng() * 0.004,
      cars: Array.from({ length: 2 }, () => rng()),
    }))
    const move = (dx: number, dy: number) => {
      if (dead) return
      px = Math.min(0.92, Math.max(0.08, px + dx))
      py = Math.min(0.94, Math.max(0.04, py + dy))
      if (dy < 0) scoreRef.current += 1
    }
    let sx = 0
    let sy = 0
    const down = (e: PointerEvent) => {
      sx = e.clientX
      sy = e.clientY
    }
    const up = (e: PointerEvent) => {
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (Math.abs(dx) + Math.abs(dy) < 12) move(0, -0.08)
      else if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 0.12 : -0.12, 0)
      else move(0, dy > 0 ? 0.08 : -0.08)
    }
    c.addEventListener('pointerdown', down)
    c.addEventListener('pointerup', up)
    let raf = 0
    const loop = () => {
      const w = c.width
      const h = c.height
      ctx.fillStyle = '#0a0d18'
      ctx.fillRect(0, 0, w, h)
      if (grace > 0) grace -= 1
      for (const lane of lanes) {
        ctx.fillStyle = '#15192c'
        ctx.fillRect(0, lane.y * h, w, h * 0.07)
        for (const car of lane.cars) {
          const cx = ((car + performance.now() * lane.speed * lane.dir * 0.02) % 1.3) - 0.15
          ctx.fillStyle = '#ff4d8d'
          ctx.fillRect(cx * w, lane.y * h + 4, w * 0.18, h * 0.05)
          const hitX = Math.abs(cx + 0.09 - px) < 0.12
          const hitY = Math.abs(lane.y + 0.035 - py) < 0.04
          if (grace <= 0 && hitX && hitY) dead = true
        }
      }
      ctx.fillStyle = '#c8f542'
      ctx.beginPath()
      ctx.arc(px * w, py * h, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillText(String(scoreRef.current), 16, 28)
      if (dead) {
        onFinish(scoreRef.current)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', down)
      c.removeEventListener('pointerup', up)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame label="desliza / toca para subir">
      <canvas ref={canvas} className="block w-full" />
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
      ctx.fillStyle = '#070814'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = colors[gate]!
      const gy = barY * h
      ctx.fillRect(w * 0.12, gy, w * 0.76, Math.max(16, h * 0.035))
      ctx.fillStyle = colors[colorRef.current]!
      ctx.beginPath()
      ctx.arc(w / 2, playerY * h, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 22px Outfit, sans-serif'
      ctx.fillText(String(points), 16, 32)
      if (armed && barY > playerY - 0.015 && barY < playerY + 0.03) {
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
        onPointerDown={() => {
          colorRef.current = (colorRef.current + 1) % 4
          setColor(colorRef.current)
        }}
      />
      <div className="flex justify-center gap-2 px-3 pb-3">
        {colors.map((hex, i) => (
          <span
            key={hex}
            className="h-4 w-4 rounded-full"
            style={{ background: hex, outline: i === color ? '3px solid white' : 'none' }}
          />
        ))}
      </div>
    </GameFrame>
  )
}

export function Piano({ seed, onFinish }: GameProps) {
  const left = useCountdown()
  const rng = useRef(mulberry32(seed))
  const [rows, setRows] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const dead = useRef(false)

  useEffect(() => {
    if (left > 0) return
    setRows(Array.from({ length: 6 }, () => randInt(rng.current, 0, 3)))
  }, [left])

  function tap(col: number, rowIndex: number) {
    if (dead.current || left > 0 || rows.length === 0) return
    if (rowIndex !== rows.length - 1) return
    const target = rows[rows.length - 1]
    if (col !== target) {
      dead.current = true
      onFinish(score)
      return
    }
    setScore((s) => s + 1)
    setRows((r) => [randInt(rng.current, 0, 3), ...r.slice(0, -1)])
  }

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame score={score} label="solo negras">
      <div className="grid grid-rows-6">
        {rows.map((black, ri) => (
          <div key={ri} className="grid grid-cols-4">
            {[0, 1, 2, 3].map((c) => (
              <button
                key={c}
                onClick={() => tap(c, ri)}
                className={`h-16 border border-white/5 ${c === black ? 'bg-zinc-100' : 'bg-zinc-900'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </GameFrame>
  )
}

export function LaneRace({ seed, onFinish }: GameProps) {
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
    let lane = 1
    let dead = false
    let grace = 40
    const cars: { lane: number; y: number }[] = []
    for (let i = 0; i < 18; i++) cars.push({ lane: randInt(rng, 0, 2), y: -i * 0.35 - rng() * 0.2 })
    const onKey = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      lane = x < 0.33 ? 0 : x > 0.66 ? 2 : 1
    }
    c.addEventListener('pointerdown', onKey)
    let raf = 0
    const loop = () => {
      const w = c.width
      const h = c.height
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 1 ? '#1a1a1a' : '#151515'
        ctx.fillRect((w / 3) * i, 0, w / 3 - 4, h)
      }
      if (grace > 0) grace -= 1
      else scoreRef.current += 1
      for (const car of cars) {
        car.y += 0.008
        if (car.y > 1.2) car.y = -0.55
        ctx.fillStyle = '#ff4d8d'
        ctx.fillRect((w / 3) * car.lane + 12, car.y * h, w / 3 - 28, 50)
        if (grace <= 0 && car.lane === lane && car.y > 0.74 && car.y < 0.9) dead = true
      }
      ctx.fillStyle = '#c8f542'
      ctx.fillRect((w / 3) * lane + 18, h * 0.8, w / 3 - 40, 56)
      if (dead) {
        onFinish(Math.floor(scoreRef.current / 8))
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      c.removeEventListener('pointerdown', onKey)
    }
  }, [canvas, left, onFinish, seed])

  if (left > 0) return <Overlay text={String(left)} />
  return (
    <GameFrame label="toca un carril">
      <canvas ref={canvas} className="block w-full" />
    </GameFrame>
  )
}
