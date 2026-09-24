import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { GamePreview } from '../components/GamePreview'
import { findGame, GAMES } from '../games/catalog'
import { bestIn, emptyCareer, type Career } from '../lib/career'
import { getStore } from '../store'
import type { GameId } from '../types'

export function Showcase() {
  const { session } = useAuth()
  const [career, setCareer] = useState<Career>(emptyCareer())
  const [span, setSpan] = useState<'month' | 'all'>('all')
  const [picked, setPicked] = useState<GameId | null>(null)

  useEffect(() => {
    if (!session) return
    return getStore().watchCareer(session.uid, setCareer)
  }, [session])

  const monthStart = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }, [])
  const marks = span === 'month' ? career.marks.filter((m) => m.at >= monthStart) : career.marks
  const monthName = new Date().toLocaleDateString('es-MX', { month: 'long' })
  const label = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  const playedIds = new Set(marks.map((mark) => mark.gameId))
  const played = GAMES.filter((game) => playedIds.has(game.id))
  const featuredId =
    played
      .slice()
      .sort((a, b) => (career.gameWins[b.id] ?? 0) - (career.gameWins[a.id] ?? 0))
      .find((g) => (career.gameWins[g.id] ?? 0) > 0)?.id ?? marks[0]?.gameId
  const featured = featuredId ? findGame(featuredId) : null
  const featuredScore = featured ? bestIn(marks, featured.id) : null
  const standout = featured ? (career.gameWins[featured.id] ?? 0) > 0 : false

  const selected = picked && playedIds.has(picked) ? findGame(picked) : null
  const board = picked && span === 'all' ? career.boards[picked] ?? [] : []

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Flame />
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-ink/50">Racha</p>
        <p className="display text-3xl font-bold leading-none text-ink">
          {career.playStreak > 0 ? `Día ${career.playStreak}` : 'Empieza hoy'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat n={career.roundsPlayed} label="Partidas" tone="bg-[#e4dcff]" />
        <Stat n={career.wins} label="Victorias" tone="bg-[#ffe0c2]" />
        <Stat n={career.rivals} label="Rivales" tone="bg-[#d4f6ef]" />
      </div>

      {featured ? (
        <section className="flex items-center gap-3 rounded-[1.4rem] border-[3px] border-ink bg-mute p-3 text-white shadow-[0_5px_0_#1c1430]">
          <GamePreview id={featured.id} className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <p className="display truncate text-xl font-bold leading-none">{featured.name}</p>
            <p className="mt-1 text-sm font-bold text-white/80">
              {standout
                ? 'Aquí es donde más destacas frente al resto.'
                : 'Juega una ronda y aquí verás dónde destacas.'}
            </p>
            {featuredScore != null && (
              <p className="display mt-1 text-lg font-bold text-yellow">{featuredScore} pts</p>
            )}
          </div>
        </section>
      ) : (
        <p className="card p-4 text-sm font-bold text-ink/60">
          {span === 'month' && career.marks.length > 0
            ? 'Este mes todavía no has cerrado una ronda.'
            : 'Cuando cierres una ronda, el juego aparece aquí.'}
        </p>
      )}

      <div className="flex justify-center gap-2">
        <button
          className={`min-h-12 rounded-full border-[3px] border-ink px-5 text-sm font-black ${
            span === 'month' ? 'bg-white text-ink shadow-[0_3px_0_#1c1430]' : 'bg-white/40 text-ink/70'
          }`}
          onClick={() => setSpan('month')}
        >
          {label}
        </button>
        <button
          className={`min-h-12 rounded-full border-[3px] border-ink px-5 text-sm font-black ${
            span === 'all' ? 'bg-white text-ink shadow-[0_3px_0_#1c1430]' : 'bg-white/40 text-ink/70'
          }`}
          onClick={() => setSpan('all')}
        >
          Siempre
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {played.map((game) => {
          const score = bestIn(marks, game.id)
          const active = picked === game.id
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => setPicked(active ? null : game.id)}
              className={`card overflow-hidden text-left ${active ? 'ring-2 ring-pink' : ''}`}
            >
              <div className="relative">
                <GamePreview id={game.id} className="h-32" />
                <p className="absolute left-2 top-2 max-w-[80%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-ink">
                  {game.name}
                </p>
                <p className="display absolute bottom-2 left-2 rounded-full border-[3px] border-ink bg-white px-2 py-0.5 text-lg font-bold leading-none text-ink">
                  {score == null ? '—' : `${score}`}
                </p>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-center text-sm font-black text-ink/55">
        {played.length ? 'Toca un juego para ver la clasificación.' : 'Aquí solo salen los juegos que ya jugaste.'}
      </p>

      {selected && (
        <section className="card space-y-3 p-4">
          <div className="flex items-center gap-3">
            <GamePreview id={selected.id} className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <h2 className="display truncate text-2xl font-bold leading-none">{selected.name}</h2>
              <p className="text-sm font-bold text-ink/60">{selected.blurb}</p>
            </div>
          </div>
          {span === 'month' ? (
            <MonthList gameId={selected.id} marks={marks} />
          ) : board.length ? (
            <div className="space-y-2">
              {board.map((row, i) => (
                <div
                  key={`${row.groupName}-${row.name}-${i}`}
                  className={`score-row flex items-center gap-2 px-3 py-2 ${row.you ? 'bg-pink text-white' : 'bg-white'}`}
                >
                  <span className="display w-6 text-center font-bold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{row.name}</p>
                    <p className={`truncate text-[11px] font-extrabold ${row.you ? 'text-white/70' : 'text-ink/45'}`}>
                      {row.groupName}
                    </p>
                  </div>
                  <span className="display shrink-0 text-xl font-bold">{row.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-bold text-ink/55">Todavía no hay marcas en este juego.</p>
          )}
          <Link to="/" className="btn btn-ghost w-full">
            Volver a tus ligas
          </Link>
        </section>
      )}
    </div>
  )
}

function MonthList({ gameId, marks }: { gameId: GameId; marks: Career['marks'] }) {
  const rows = marks.filter((m) => m.gameId === gameId)
  if (!rows.length) return <p className="text-sm font-bold text-ink/55">Este mes aún no lo has jugado.</p>
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={`${row.at}-${i}`} className="score-row flex items-center justify-between gap-2 bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="truncate font-black">{row.groupName}</p>
            <p className="text-[11px] font-extrabold text-ink/45">
              {new Date(row.at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <span className="display text-xl font-bold">{row.score}</span>
        </div>
      ))}
    </div>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className={`rounded-[1.2rem] border-[3px] border-ink px-2 py-3 text-center shadow-[0_4px_0_#1c1430] ${tone}`}>
      <p className="display text-3xl font-bold leading-none text-ink">{n}</p>
      <p className="mt-1 text-[10px] font-black uppercase leading-tight tracking-wide text-ink/70">{label}</p>
    </div>
  )
}

function Flame() {
  return (
    <svg viewBox="0 0 64 72" className="mx-auto h-14 w-12" aria-hidden>
      <path
        d="M32 4c2 14-8 18-8 30 0 8 6 12 8 20 2-10 14-12 14-26C46 14 36 12 32 4z"
        fill="#ff8a3d"
        stroke="#1c1430"
        strokeWidth="3"
      />
      <path d="M32 34c1 8-4 10-4 16 2-4 8-4 8-10-2-2-4-4-4-6z" fill="#ffd145" />
    </svg>
  )
}
