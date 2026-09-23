import type { Member } from '../types'

export function Streaks({ member, compact = false }: { member: Member; compact?: boolean }) {
  const chips = [
    member.winStreak >= 2 ? { k: `🔥 ${member.winStreak}`, c: 'bg-pink text-white' } : null,
    member.playStreak >= 3 ? { k: `⚡ ${member.playStreak}`, c: 'bg-lime text-ink' } : null,
    member.podiumStreak >= 3 ? { k: `🥉 ${member.podiumStreak}`, c: 'bg-cyan text-ink' } : null,
    member.notLastStreak >= 5 ? { k: `😎 ${member.notLastStreak}`, c: 'bg-orange text-ink' } : null,
  ].filter(Boolean) as { k: string; c: string }[]

  if (!chips.length) {
    return compact ? null : <p className="text-xs text-white/35">Sin racha todavía</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c.k} className={`rounded-full px-2 py-0.5 text-[11px] font-black ${c.c}`}>
          {c.k}
        </span>
      ))}
    </div>
  )
}
