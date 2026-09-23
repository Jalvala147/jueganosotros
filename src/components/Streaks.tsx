import type { Member } from '../types'

export function Streaks({ member, compact = false }: { member: Member; compact?: boolean }) {
  const chips = [
    member.winStreak >= 2 ? { k: `🔥 ${member.winStreak}`, c: 'bg-white text-ink' } : null,
    member.playStreak >= 3 ? { k: `⚡ ${member.playStreak}`, c: 'bg-ink text-yellow' } : null,
    member.podiumStreak >= 3 ? { k: `🥉 ${member.podiumStreak}`, c: 'bg-white text-purple' } : null,
    member.notLastStreak >= 5 ? { k: `😎 ${member.notLastStreak}`, c: 'bg-ink text-pink' } : null,
  ].filter(Boolean) as { k: string; c: string }[]

  if (!chips.length) {
    return compact ? null : <p className="text-xs font-bold text-ink/50">Sin racha todavía</p>
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
