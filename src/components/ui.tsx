import type { GameMeta } from '../types'

const PALETTE = ['#ff3d8f', '#c6ff3d', '#3ef0ff', '#ff8a1f', '#8b5cff', '#ffe14a']

export function colorFromName(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % PALETTE.length
  return PALETTE[h]!
}

export function Avatar({
  name,
  photo,
  size = 44,
}: {
  name: string
  photo?: string | null
  size?: number
}) {
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="rounded-full object-cover ring-2 ring-white/20"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-display text-lg font-bold text-ink ring-2 ring-white/15"
      style={{ width: size, height: size, background: colorFromName(name), fontFamily: 'Fredoka, sans-serif' }}
    >
      {initial}
    </div>
  )
}

export function GameGlyph({ game, size = 72 }: { game: GameMeta; size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-[1.4rem] shadow-[0_6px_0_rgba(0,0,0,.25)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${game.accent}, ${game.accent}cc)`,
        fontSize: size * 0.46,
      }}
    >
      {game.emoji}
    </div>
  )
}

export function CodeChip({ code }: { code: string }) {
  return (
    <button
      type="button"
      className="mono rounded-full bg-lime px-3 py-1 text-sm font-bold text-ink"
      onClick={() => void navigator.clipboard?.writeText(code)}
      title="Copiar código"
    >
      {code}
    </button>
  )
}
