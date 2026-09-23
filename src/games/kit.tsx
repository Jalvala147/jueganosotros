import { useEffect, useRef, useState, type ReactNode } from 'react'

export type GameProps = {
  seed: number
  onFinish: (score: number) => void
}

export function GameFrame({
  children,
  score,
  label,
}: {
  children: ReactNode
  score?: number | string
  label?: string
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-[#0a0d18]">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-white/50">
        <span>{label}</span>
        <span className="mono text-lime">{score ?? ''}</span>
      </div>
      {children}
    </div>
  )
}

export function useCountdown(seconds = 3) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) return
    const t = window.setTimeout(() => setLeft((n) => n - 1), 700)
    return () => window.clearTimeout(t)
  }, [left])
  return left
}

export function Overlay({ text }: { text: string }) {
  return (
    <div className="flex h-80 items-center justify-center text-6xl font-extrabold text-lime">
      {text}
    </div>
  )
}

export function useCanvas(height = 420) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const parent = c.parentElement
    const resize = () => {
      const w = parent?.clientWidth ?? 360
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.floor(w * dpr)
      c.height = Math.floor(height * dpr)
      c.style.width = `${w}px`
      c.style.height = `${height}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [height])
  return ref
}
