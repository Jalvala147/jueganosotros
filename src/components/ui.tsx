import { AvatarFace } from './AvatarFace'
import { GamePreview } from './GamePreview'
import { defaultAvatar, hashName, type AvatarLook } from '../lib/avatar'
import type { GameMeta } from '../types'

export function Avatar({
  name,
  photo,
  look,
  size = 44,
  ring = '#fff',
}: {
  name: string
  photo?: string | null
  look?: AvatarLook | null
  size?: number
  ring?: string
}) {
  const style = { width: size, height: size, boxShadow: ring !== 'transparent' ? `0 0 0 3px ${ring}` : undefined }
  if (look) {
    return <AvatarFace look={look} size={size} ring={ring} />
  }
  if (photo) {
    return <img src={photo} alt="" className="shrink-0 rounded-full object-cover" style={style} />
  }
  return <AvatarFace look={defaultAvatar(hashName(name || '?'))} size={size} ring={ring} />
}

export function FaceRow({
  people,
  ring = '#fff',
  max = 5,
}: {
  people: { uid?: string; name: string; photo?: string | null; look?: AvatarLook | null }[]
  ring?: string
  max?: number
}) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <div className="flex min-w-0 items-center">
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          <Avatar key={p.uid ?? `${p.name}-${i}`} name={p.name} photo={p.photo} look={p.look} size={36} ring={ring} />
        ))}
      </div>
      {extra > 0 && <span className="ml-1.5 shrink-0 text-xs font-black">+{extra}</span>}
    </div>
  )
}

export function GameArt({ game, className = 'h-32' }: { game: GameMeta; className?: string }) {
  return <GamePreview id={game.id} className={className} />
}

export function GameGlyph({ game, size = 64 }: { game: GameMeta; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[1.15rem] border-[3px] border-ink shadow-[0_4px_0_#1c1430]"
      style={{ width: size, height: size }}
    >
      <GamePreview id={game.id} className="h-full w-full" />
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

export function placeFrame(place: number): string {
  if (place === 1) return 'outline outline-[5px] outline-offset-2 outline-yellow'
  if (place === 2) return 'outline outline-[4px] outline-offset-2 outline-white'
  if (place === 3) return 'outline outline-[4px] outline-offset-2 outline-[#cd7f32]'
  return ''
}
