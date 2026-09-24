import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LeaderCharts } from '../components/Charts'
import { Streaks } from '../components/Streaks'
import { GroupChat } from '../components/GroupChat'
import { Avatar, CodeChip, GameArt, GameGlyph, placeFrame, rankTone } from '../components/ui'
import { findGame, GAME_MAP } from '../games/catalog'
import { attemptsToBest, changeIsDue, compareMembers, compareScores, eloTier } from '../lib/scoring'
import { getStore } from '../store'
import type { GroupSnapshot, Member } from '../types'

type Tab = 'ronda' | 'temporada' | 'grafica' | 'duelos' | 'juegos'

const TABS: { id: Tab; label: string }[] = [
  { id: 'ronda', label: 'Ronda' },
  { id: 'temporada', label: 'Temporada' },
  { id: 'grafica', label: 'Gráfica' },
  { id: 'duelos', label: 'Duelos' },
  { id: 'juegos', label: 'Juegos' },
]

const meMark = 'ring-2 ring-ink'

export function GroupHub() {
  const { groupId = '' } = useParams()
  const { session } = useAuth()
  const [snap, setSnap] = useState<GroupSnapshot | null>(null)
  const [tab, setTab] = useState<Tab>('ronda')
  const [error, setError] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const clockRound = useRef('')

  useEffect(() => {
    return getStore().watchGroup(groupId, setSnap)
  }, [groupId])

  useEffect(() => {
    if (!snap || snap.round.status !== 'active') return
    if (clockRound.current === snap.round.id) return
    if (!changeIsDue(snap.round.startedAt, snap.group.settings.changeMinutes)) return
    clockRound.current = snap.round.id
    void getStore().closeAndAdvance(groupId)
  }, [groupId, snap])

  const me = snap?.members.find((m) => m.uid === session?.uid)
  const table = useMemo(() => [...(snap?.members ?? [])].sort(compareMembers), [snap])
  const game = snap ? findGame(snap.round.gameId) : null
  const play = session ? snap?.plays[session.uid] : undefined
  const finishedCount = Object.values(snap?.plays ?? {}).filter((p) => p.finished).length
  const hideScores = Boolean(me && !play?.finished)

  if (!snap || !game || !session) {
    return <p className="font-black text-ink/60">Cargando grupo…</p>
  }

  const timedOut = Date.now() > snap.round.timeoutAt
  const myTurnDone = Boolean(play?.finished)
  const votes = snap.round.advanceVotes ?? []
  const allPlayed = snap.members.length > 0 && finishedCount >= snap.members.length
  const voted = votes.includes(session.uid)
  const needed = Math.floor(snap.members.length / 2) + 1
  const changeLabel = formatClock(snap.group.settings.changeMinutes)

  async function closeRound() {
    setError(null)
    try {
      await getStore().closeAndAdvance(groupId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar')
    }
  }

  async function resetSeason() {
    if (!session) return
    if (!confirm('¿Nueva temporada? Se reinician puntos y rachas, no el Elo.')) return
    await getStore().newSeason(groupId, session.uid)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-ink/50">
            Temporada {snap.group.seasonNumber}
          </p>
          <h1 className="display break-words text-4xl font-bold leading-none text-ink">{snap.group.name}</h1>
          <div className="mt-3">
            <CodeChip code={snap.group.code} />
          </div>
        </div>
        {session.uid === snap.group.createdBy && (
          <button
            className="min-h-12 shrink-0 rounded-full border-[3px] border-ink bg-white px-4 text-sm font-black text-ink"
            onClick={() => void resetSeason()}
          >
            Reiniciar
          </button>
        )}
      </div>

      {game ? (
      <section className="card overflow-hidden">
        <GameArt game={game} className="h-28" />
        <div className="space-y-3 p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">
              Ronda {snap.round.index} · {game.category}
            </p>
            <h2 className="display break-words text-3xl font-bold leading-none">{game.name}</h2>
          </div>
          <p className="text-sm font-bold text-ink/70">{game.blurb}</p>
          {snap.members.length < 2 && (
            <p className="rounded-2xl border-[3px] border-ink bg-yellow px-3 py-2 text-sm font-black text-ink">
              Manda el código. La ronda espera a que se una alguien más.
            </p>
          )}
          <div className="flex items-center justify-between text-sm font-black text-ink/60">
            <span>
              {finishedCount}/{snap.members.length} listos
            </span>
            <span>{game.direction === 'higher' ? '↑ gana el más alto' : '↓ gana el más bajo'}</span>
          </div>
          {changeLabel && (
            <p className="text-sm font-black leading-relaxed text-ink/70">Cambia solo a las {changeLabel}.</p>
          )}
          <FaceStack members={snap.members} plays={snap.plays} />
          {!myTurnDone ? (
            <Link to={`/grupo/${groupId}/jugar`} className="btn btn-pink w-full">
              Jugar mi turno
            </Link>
          ) : (
            <p className="rounded-full border-[3px] border-ink bg-yellow py-3 text-center font-black text-ink">
              Turno enviado. A esperar…
            </p>
          )}
        </div>
      </section>
      ) : (
        <section className="card space-y-2 p-5">
          <p className="text-lg font-extrabold leading-snug">Este juego ya no está.</p>
          <p className="font-bold leading-relaxed text-ink/70">Cierren la ronda para seguir con la siguiente.</p>
        </section>
      )}

      <GroupChat groupId={groupId} uid={session.uid} name={me?.displayName ?? 'Jugador'} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`display min-h-12 shrink-0 rounded-full border-[3px] border-ink px-4 text-sm font-bold ${
              tab === t.id ? 'bg-pink text-white shadow-[0_4px_0_#1c1430]' : 'bg-mute text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ronda' && (
        <RoundTable members={table} snap={snap} hideScores={hideScores} me={session.uid} />
      )}
      {tab === 'temporada' && <SeasonBoard members={table} me={session.uid} />}
      {tab === 'grafica' && <LeaderCharts members={table} me={session.uid} />}
      {tab === 'duelos' && me && <H2H me={me} members={table} />}
      {tab === 'juegos' && <Kings members={table} />}

      {allPlayed && snap.round.status === 'active' && (
        <section className="card space-y-3 p-4">
          <p className="text-lg font-extrabold leading-snug">Todos terminaron sus dos turnos.</p>
          <p className="text-sm font-bold leading-relaxed text-ink/70">
            {votes.length} de {needed} aceptaron avanzar. El juego cambia cuando la mayoría diga que sí.
          </p>
          <button
            className="btn btn-pink w-full"
            disabled={voted || voting}
            onClick={() => {
              setVoting(true)
              setError(null)
              void getStore()
                .voteAdvance(groupId, session.uid)
                .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo avanzar'))
                .finally(() => setVoting(false))
            }}
          >
            {voted ? 'Ya aceptaste' : 'Acepto avanzar'}
          </button>
        </section>
      )}

      {(timedOut || session.uid === snap.group.createdBy) && !allPlayed && (
        <button className="btn btn-ghost w-full" onClick={() => void closeRound()}>
          {timedOut ? 'Cerrar ronda (tiempo agotado)' : 'Cerrar y saltar ausentes'}
        </button>
      )}
      {error && <p className="text-sm font-black text-pink">{error}</p>}

      {snap.history.length > 0 && (
        <section>
          <h3 className="display mb-2 text-2xl font-bold text-ink">Últimas rondas</h3>
          <div className="space-y-2">
            {snap.history.map((r) => {
              const meta = findGame(r.gameId)
              const winner = r.results?.[0]
              const name = table.find((m) => m.uid === winner?.uid)?.displayName
              return (
                <div key={r.id} className="score-row flex items-center justify-between gap-2 bg-mute px-3 py-2 text-white">
                  <span className="flex min-w-0 items-center gap-2 font-extrabold">
                    {meta && <GameGlyph game={meta} size={42} />}
                    <span className="truncate">
                      #{r.index} {meta?.name ?? 'Juego retirado'}
                    </span>
                  </span>
                  <span className="display max-w-[42%] shrink-0 truncate text-right text-sm font-bold text-yellow">
                    {name ?? '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function formatClock(minutes?: number) {
  if (minutes == null) return null
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function SeasonBoard({ members, me }: { members: Member[]; me: string }) {
  return (
    <div className="space-y-3">
      <p className="display text-3xl font-bold leading-none text-ink">Temporada</p>
      {members.map((m, i) => (
        <div
          key={m.uid}
          className={`score-row flex items-center gap-3 px-3 py-3 ${rankTone(i)} ${placeFrame(i + 1)} ${m.uid === me ? meMark : ''}`}
        >
          <PlaceMark place={i + 1} />
          <Avatar name={m.displayName} photo={m.photoURL} look={m.avatar} size={48} ring="transparent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-black leading-tight">
              {i === 0 ? '👑 ' : ''}
              {m.displayName}
            </p>
            <p className="truncate text-sm font-extrabold leading-snug opacity-80">
              {m.wins} victorias · {eloTier(m.elo)} {m.elo}
            </p>
            <Streaks member={m} compact />
          </div>
          <div className="shrink-0 text-right">
            <p className="display text-4xl font-bold leading-none">{m.seasonPoints}</p>
            <p className="text-xs font-black uppercase opacity-70">pts</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RoundTable({
  members,
  snap,
  hideScores,
  me,
}: {
  members: Member[]
  snap: GroupSnapshot
  hideScores: boolean
  me: string
}) {
  const lower = findGame(snap.round.gameId)?.direction === 'lower'
  const rows = [...members].sort((a, b) => {
    const pa = snap.plays[a.uid]
    const pb = snap.plays[b.uid]
    const aDone = Boolean(pa?.finished && pa.best != null)
    const bDone = Boolean(pb?.finished && pb.best != null)
    if (aDone !== bDone) return aDone ? -1 : 1
    if (!aDone || !bDone || pa?.best == null || pb?.best == null) return 0
    return compareScores(
      { uid: a.uid, best: pa.best, attempts: attemptsToBest(pa.official, pa.best), at: pa.updatedAt },
      { uid: b.uid, best: pb.best, attempts: attemptsToBest(pb.official, pb.best), at: pb.updatedAt },
      lower,
    )
  })
  return (
    <div className="space-y-3">
      <p className="display text-3xl font-bold leading-none text-ink">Esta ronda</p>
      {rows.map((m, i) => {
        const play = snap.plays[m.uid]
        const numeric = Boolean(play?.finished && play.best != null)
        const hidden = numeric && hideScores && m.uid !== me
        const tries = play ? attemptsToBest(play.official, play.best) : 0
        const score = numeric
          ? hidden
            ? '•••'
            : String(play!.best)
          : play?.official.length
            ? `Intento ${play.official.length}/2`
            : 'Esperando'
        return (
          <div
            key={m.uid}
            className={`score-row flex items-center gap-3 px-3 py-3 ${rankTone(numeric ? i : 99)} ${
              numeric ? placeFrame(i + 1) : ''
            }`}
          >
            <PlaceMark place={numeric ? i + 1 : i + 1} muted={!numeric} />
            <Avatar name={m.displayName} photo={m.photoURL} look={m.avatar} size={48} ring="transparent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-black leading-tight">
                {numeric && i === 0 ? '👑 ' : ''}
                {m.displayName}
              </p>
              {numeric && !hidden && (
                <p className="text-sm font-extrabold opacity-80">
                  Intento {tries}/2
                </p>
              )}
            </div>
            <p className={`display shrink-0 text-right font-bold leading-none ${numeric ? 'text-4xl' : 'max-w-[7rem] text-sm uppercase'}`}>
              {score}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function PlaceMark({ place, muted = false }: { place: number; muted?: boolean }) {
  return (
    <span
      className={`display grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-[3px] border-ink text-2xl font-bold ${
        muted ? 'bg-white/20' : 'bg-white text-ink'
      }`}
    >
      {place === 1 && !muted ? '1' : place}
    </span>
  )
}

function H2H({ me, members }: { me: Member; members: Member[] }) {
  const others = members.filter((m) => m.uid !== me.uid)
  if (!others.length) return <p className="font-bold text-ink/60">Invita a alguien para ver duelos.</p>
  return (
    <div className="space-y-2">
      {others.map((o) => {
        const cell = me.h2h[o.uid] ?? { wins: 0, losses: 0 }
        return (
          <div key={o.uid} className="score-row flex items-center justify-between gap-2 bg-mute px-3 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={o.displayName} photo={o.photoURL} look={o.avatar} size={38} ring="#4C4660" />
              <p className="truncate font-black">{o.displayName}</p>
            </div>
            <p className="display shrink-0 text-2xl font-bold leading-none">
              <span className="text-yellow">{cell.wins}</span>
              <span className="text-white/40"> – </span>
              <span className="text-pink">{cell.losses}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}

function FaceStack({
  members,
  plays,
}: {
  members: Member[]
  plays: GroupSnapshot['plays']
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {members.map((m) => (
        <div key={m.uid} className="flex min-w-0 items-center gap-2 rounded-2xl border-[3px] border-ink bg-white px-2 py-2">
          <Avatar name={m.displayName} photo={m.photoURL} look={m.avatar} size={40} ring="#fff" />
          <div className="min-w-0">
            <p className="truncate font-black leading-tight text-ink">{m.displayName}</p>
            <p className="text-xs font-extrabold text-ink/50">{plays[m.uid]?.finished ? 'Listo' : 'En la liga'}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Kings({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(GAME_MAP).map((g) => {
        const king = [...members].sort((a, b) => (b.gameWins[g.id] ?? 0) - (a.gameWins[g.id] ?? 0))[0]
        const wins = king ? (king.gameWins[g.id] ?? 0) : 0
        return (
          <div key={g.id} className="card p-3">
            <GameGlyph game={g} size={48} />
            <p className="display mt-2 truncate font-bold leading-none">{g.name}</p>
            <p className="mt-1 truncate text-xs font-extrabold text-ink/55">
              {wins ? `${king!.displayName} · ${wins}` : 'sin rey'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
