import { formPoints } from '../lib/scoring'
import type { Member } from '../types'

const PALETTE = ['#ff4571', '#ffd145', '#8260f6', '#28dad4', '#ff8a3d', '#4c4660']

function tone(index: number, me: boolean) {
  return me ? '#ff4571' : PALETTE[index % PALETTE.length]!
}

export function LeaderCharts({ members, me }: { members: Member[]; me: string }) {
  const ranked = members
  const bars = ranked.map((m, i) => ({
    id: m.uid,
    name: m.displayName,
    value: m.seasonPoints,
    color: tone(i, m.uid === me),
    me: m.uid === me,
  }))
  const elo = ranked.map((m, i) => ({
    id: m.uid,
    name: m.displayName,
    value: m.elo,
    color: tone(i, m.uid === me),
    me: m.uid === me,
  }))
  const series = ranked.map((m, i) => ({
    id: m.uid,
    name: m.displayName,
    color: tone(i, m.uid === me),
    points: m.lastFivePoints,
  }))
  const played = series.some((s) => s.points.length > 0)

  return (
    <div className="space-y-3">
      <section className="card space-y-3 p-4">
        <header className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">Temporada</p>
            <h3 className="display text-2xl font-bold leading-none">Puntos</h3>
          </div>
          <ShareDonut slices={bars} />
        </header>
        <BarList rows={bars} empty="Todavía nadie suma puntos." />
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">Últimas 5 rondas</p>
          <h3 className="display text-2xl font-bold leading-none">Forma</h3>
        </div>
        {played ? <FormLines series={series} /> : <p className="text-sm font-bold text-ink/55">La forma aparece cuando se cierra una ronda.</p>}
        <ul className="space-y-1">
          {ranked.map((m, i) => (
            <li key={m.uid} className="flex items-center justify-between gap-2 text-sm font-black">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full border-2 border-ink" style={{ background: tone(i, m.uid === me) }} />
                <span className="truncate">{m.displayName}</span>
              </span>
              <span className="shrink-0 text-ink/60">{formPoints(m.lastFivePoints)} forma</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">Rating</p>
          <h3 className="display text-2xl font-bold leading-none">Elo</h3>
        </div>
        <BarList rows={elo} min={800} empty="Sin Elo todavía." />
      </section>
    </div>
  )
}

function BarList({
  rows,
  min = 0,
  empty,
}: {
  rows: { id: string; name: string; value: number; color: string; me?: boolean }[]
  min?: number
  empty: string
}) {
  if (!rows.length) return <p className="text-sm font-bold text-ink/55">{empty}</p>
  const max = Math.max(min + 1, ...rows.map((r) => r.value), 1)
  const floor = Math.min(min, ...rows.map((r) => r.value))
  const span = Math.max(1, max - floor)
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const width = Math.max(8, ((r.value - floor) / span) * 100)
        return (
          <div key={r.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className={`min-w-0 truncate text-sm font-black ${r.me ? 'text-pink' : ''}`}>{r.name}</p>
              <p className="display shrink-0 text-sm font-bold">{r.value}</p>
            </div>
            <div className="h-6 overflow-hidden rounded-full border-[3px] border-ink bg-white/70">
              <div className="h-full rounded-full" style={{ width: `${width}%`, background: r.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ShareDonut({
  slices,
}: {
  slices: { id: string; name: string; value: number; color: string }[]
}) {
  const alive = slices.filter((s) => s.value > 0)
  const total = alive.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) {
    return (
      <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-hidden>
        <circle cx="36" cy="36" r="24" fill="none" stroke="#1c1430" strokeWidth="10" opacity="0.15" />
      </svg>
    )
  }
  let angle = -Math.PI / 2
  const r = 24
  const cx = 36
  const cy = 36
  const paths = alive.map((s) => {
    const sweep = (s.value / total) * Math.PI * 2
    const start = angle
    const end = angle + sweep
    angle = end
    if (sweep >= Math.PI * 2 - 0.001) {
      return { id: s.id, color: s.color, d: '' , full: true }
    }
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end - 0.0001)
    const y2 = cy + r * Math.sin(end - 0.0001)
    const large = sweep > Math.PI ? 1 : 0
    return {
      id: s.id,
      color: s.color,
      full: false,
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
    }
  })
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-label="Reparto de puntos">
      {paths.map((p) =>
        p.full ? (
          <circle key={p.id} cx={cx} cy={cy} r={r} fill={p.color} />
        ) : (
          <path key={p.id} d={p.d} fill={p.color} stroke="#1c1430" strokeWidth="1.5" />
        ),
      )}
      <circle cx={cx} cy={cy} r="12" fill="#fff" stroke="#1c1430" strokeWidth="2" />
    </svg>
  )
}

function FormLines({
  series,
}: {
  series: { id: string; name: string; color: string; points: number[] }[]
}) {
  const W = 320
  const H = 148
  const padL = 26
  const padR = 10
  const padT = 12
  const padB = 22
  const slots = 5
  const max = Math.max(10, ...series.flatMap((s) => s.points), 1)
  const xAt = (slot: number) => padL + (slot / (slots - 1)) * (W - padL - padR)
  const yAt = (value: number) => padT + (1 - value / max) * (H - padT - padB)
  const ticks = [0, Math.round(max / 2), max]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Puntos de las últimas rondas">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={yAt(t)} y2={yAt(t)} stroke="#1c1430" strokeOpacity="0.12" />
          <text x={0} y={yAt(t) + 3} fontSize="9" fontWeight="800" fill="#1c1430" opacity="0.45">
            {t}
          </text>
        </g>
      ))}
      {Array.from({ length: slots }, (_, slot) => (
        <text key={slot} x={xAt(slot)} y={H - 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1c1430" opacity="0.45">
          {slot + 1}
        </text>
      ))}
      {series.map((s) => {
        if (!s.points.length) return null
        const start = slots - s.points.length
        const pts = s.points.map((value, i) => `${xAt(start + i)},${yAt(value)}`).join(' ')
        return (
          <g key={s.id}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {s.points.map((value, i) => (
              <circle key={i} cx={xAt(start + i)} cy={yAt(value)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2.5" />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
