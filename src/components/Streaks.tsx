import type { Member } from '../types'

export function Streaks({ member, compact = false }: { member: Member; compact?: boolean }) {
  const chips = [
    member.winStreak >= 2 ? { k: `🔥 ${member.winStreak} victorias`, c: 'bg-pink/20 text-pink' } : null,
    member.playStreak >= 3 ? { k: `⚡ ${member.playStreak} seguidas`, c: 'bg-lime/15 text-lime' } : null,
    member.podiumStreak >= 3 ? { k: `🥉 ${member.podiumStreak} podios`, c: 'bg-cyan/15 text-cyan' } : null,
    member.notLastStreak >= 5 ? { k: `😎 ${member.notLastStreak} sin colista`, c: 'bg-white/10' } : null,
  ].filter(Boolean) as { k: string; c: string }[]

  if (!chips.length) {
    return compact ? null : <p className="text-xs text-white/35">Sin racha todavía</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c.k} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.c}`}>
          {c.k}
        </span>
      ))}
    </div>
  )
}
