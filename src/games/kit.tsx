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
    <div className="overflow-hidden rounded-[1.7rem] border-[3px] border-ink bg-white shadow-[0_8px_0_#1c1430]">
      <div className="flex items-center justify-between gap-2 bg-yellow px-3 py-2">
        <span className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.16em] text-ink/70">{label}</span>
        {score != null && score !== '' && (
          <span className="display shrink-0 rounded-full border-[3px] border-ink bg-white px-3 py-0.5 text-lg font-bold leading-none text-ink">
            {score}
          </span>
        )}
      </div>
      <div className="bg-[#fff8ee] text-ink">{children}</div>
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
    <div className="grid h-80 place-items-center rounded-[1.7rem] border-[3px] border-ink bg-white shadow-[0_8px_0_#1c1430]">
      <span className="display text-8xl font-bold leading-none text-pink">{text}</span>
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
