import type { GameMeta } from '../types'

const PALETTE = ['#ff4571', '#ffd145', '#8260f6', '#28dad4', '#4c4660', '#ff8a3d']

export function colorFromName(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % PALETTE.length
  return PALETTE[h]!
}

export function Avatar({
  name,
  photo,
  size = 44,
  ring = '#fff',
}: {
  name: string
  photo?: string | null
  size?: number
  ring?: string
}) {
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  const style = { width: size, height: size, boxShadow: `0 0 0 3px ${ring}` }
  if (photo) {
    return <img src={photo} alt="" className="rounded-full object-cover" style={style} />
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-black text-white"
      style={{ ...style, background: colorFromName(name), fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  )
}

export function FaceRow({
  people,
  ring = '#fff',
}: {
  people: { name: string; photo?: string | null }[]
  ring?: string
}) {
  const shown = people.slice(0, 6)
  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <Avatar key={p.name + (p.photo ?? '')} name={p.name} photo={p.photo} size={36} ring={ring} />
      ))}
    </div>
  )
}

const SCENES: Record<string, { from: string; to: string }> = {
  Reflejo: { from: '#28DAD4', to: '#FFD145' },
  Timing: { from: '#8260F6', to: '#28DAD4' },
  Arcade: { from: '#FF4571', to: '#FFD145' },
  Memoria: { from: '#8260F6', to: '#FF4571' },
  Endless: { from: '#28DAD4', to: '#8260F6' },
  Precisión: { from: '#FFD145', to: '#FF4571' },
  Puntería: { from: '#FF4571', to: '#8260F6' },
  Deporte: { from: '#28DAD4', to: '#FFD145' },
  Ritmo: { from: '#4C4660', to: '#8260F6' },
  Puzzle: { from: '#FFD145', to: '#28DAD4' },
  Números: { from: '#28DAD4', to: '#FF4571' },
  Palabras: { from: '#FFD145', to: '#8260F6' },
  Acción: { from: '#FF4571', to: '#FFD145' },
}

export function GameArt({ game, className = 'h-32' }: { game: GameMeta; className?: string }) {
  const scene = SCENES[game.category] ?? { from: '#FF4571', to: '#FFD145' }
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${scene.from}, ${scene.to})` }}
    >
      <span className="absolute -left-1 top-2 h-16 w-4 rounded-full bg-white/35" />
      <span className="absolute right-5 top-0 h-full w-4 rounded-full bg-black/10" />
      <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/25" />
      <span
        className="absolute bottom-3 right-14 h-0 w-0 border-x-[14px] border-b-[24px] border-x-transparent"
        style={{ borderBottomColor: 'rgba(255,255,255,.7)' }}
      />
      <div className="absolute inset-0 grid place-items-center text-6xl drop-shadow-[0_6px_0_rgba(28,20,48,0.15)]">
        {game.emoji}
      </div>
    </div>
  )
}

export function GameGlyph({ game, size = 64 }: { game: GameMeta; size?: number }) {
  const scene = SCENES[game.category] ?? { from: '#FF4571', to: '#FFD145' }
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[1.15rem] border-[3px] border-ink shadow-[0_4px_0_#1c1430]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${scene.from}, ${scene.to})`,
      }}
    >
      <span className="absolute right-1 top-1 h-1/2 w-1.5 rounded-full bg-white/55" />
      <span style={{ fontSize: size * 0.42 }}>{game.emoji}</span>
    </div>
  )
}

export function CodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-yellow px-3 py-1 text-ink shadow-[0_4px_0_#1c1430]">
      <span className="text-[10px] font-black tracking-[0.18em]">CÓDIGO</span>
      <span className="display text-base font-bold tracking-[0.2em]">{code}</span>
    </span>
  )
}

export function StickMark({ size = 96 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-[1.7rem] border-[3px] border-ink bg-white shadow-[0_7px_0_#1c1430]"
      style={{ width: size, height: size }}
    >
      <span className="flex items-end gap-1.5">
        <span className="block w-3.5 rounded-full bg-pink" style={{ height: size * 0.34 }} />
        <span className="block w-3.5 rounded-full bg-yellow" style={{ height: size * 0.52 }} />
        <span className="block w-3.5 rounded-full bg-purple" style={{ height: size * 0.28 }} />
      </span>
    </div>
  )
}

export function SceneDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <span className="bubble -left-12 top-6 h-40 w-40" />
      <span className="bubble -right-10 top-44 h-32 w-32" />
      <span className="bubble bottom-8 left-4 h-24 w-24" />
      <span className="tri left-6 top-[46%]" />
      <span className="tri right-8 top-28" style={{ borderBottomColor: '#8260F6' }} />
      <span className="stick right-4 top-3 h-28 bg-pink" />
      <span className="stick bottom-16 left-2 h-16 bg-yellow" />
      <span className="stick bottom-6 right-20 h-20 bg-purple" />
    </div>
  )
}

export function rankTone(index: number): string {
  if (index === 0) return 'bg-pink text-white'
  if (index === 1) return 'bg-yellow text-ink'
  if (index === 2) return 'bg-purple text-white'
  return 'bg-mute text-white'
}
