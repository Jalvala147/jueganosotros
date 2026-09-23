import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Streaks } from '../components/Streaks'
import { GAME_MAP } from '../games/catalog'
import { compareMembers, formPoints } from '../lib/scoring'
import { getStore } from '../store'
import type { GroupSnapshot, Member } from '../types'

type Tab = 'ronda' | 'temporada' | 'duelos' | 'juegos'

export function GroupHub() {
  const { groupId = '' } = useParams()
  const { session } = useAuth()
  const [snap, setSnap] = useState<GroupSnapshot | null>(null)
  const [tab, setTab] = useState<Tab>('ronda')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return getStore().watchGroup(groupId, setSnap)
  }, [groupId])

  const me = snap?.members.find((m) => m.uid === session?.uid)
  const table = useMemo(() => [...(snap?.members ?? [])].sort(compareMembers), [snap])
  const game = snap ? GAME_MAP[snap.round.gameId] : null
  const play = session ? snap?.plays[session.uid] : undefined
  const finishedCount = Object.values(snap?.plays ?? {}).filter((p) => p.finished).length
  const hideScores = Boolean(me && !play?.finished)

  if (!snap || !game || !session) {
    return <p className="text-white/50">Cargando grupo…</p>
  }

  const timedOut = Date.now() > snap.round.timeoutAt
  const myTurnDone = Boolean(play?.finished)

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
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono text-xs text-white/40">TEMPORADA {snap.group.seasonNumber}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{snap.group.name}</h1>
          <p className="mono text-lime">{snap.group.code}</p>
        </div>
        {session.uid === snap.group.createdBy && (
          <button className="text-xs text-white/40" onClick={() => void resetSeason()}>
            Nueva temporada
          </button>
        )}
      </div>

      <section className="card overflow-hidden">
        <div className="px-4 py-3" style={{ background: `${game.accent}22` }}>
          <p className="text-[11px] uppercase tracking-wider text-white/50">
            Ronda {snap.round.index} · {game.category}
          </p>
          <h2 className="text-2xl font-extrabold">{game.name}</h2>
          <p className="text-sm text-white/65">{game.blurb}</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-white/60">
          <span>
            {finishedCount}/{snap.members.length} ya jugaron
          </span>
          <span className="mono">{game.direction === 'higher' ? 'más alto gana' : 'menos gana'}</span>
        </div>
        {!myTurnDone ? (
          <Link to={`/grupo/${groupId}/jugar`} className="btn btn-lime mx-4 mb-4">
            Jugar mi turno
          </Link>
        ) : (
          <p className="px-4 pb-4 text-sm text-lime">Turno enviado. Esperando al resto.</p>
        )}
      </section>

      <div className="flex gap-2 overflow-x-auto text-sm">
        {(['ronda', 'temporada', 'duelos', 'juegos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 capitalize ${tab === t ? 'bg-lime text-ink' : 'bg-card text-white/60'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'ronda' && (
        <RoundTable members={table} snap={snap} hideScores={hideScores} me={session.uid} />
      )}
      {tab === 'temporada' && <SeasonTable members={table} me={session.uid} />}
      {tab === 'duelos' && me && <H2H me={me} members={table} />}
      {tab === 'juegos' && <Kings members={table} />}

      {(timedOut || session.uid === snap.group.createdBy) && (
        <button className="btn btn-ghost w-full" onClick={() => void closeRound()}>
          {timedOut ? 'Cerrar ronda (tiempo agotado)' : 'Cerrar y saltar ausentes'}
        </button>
      )}
      {error && <p className="text-sm text-pink">{error}</p>}

      {snap.history.length > 0 && (
        <section>
          <h3 className="mb-2 font-bold">Últimas rondas</h3>
          <div className="space-y-2">
            {snap.history.map((r) => {
              const winner = r.results?.[0]
              const name = table.find((m) => m.uid === winner?.uid)?.displayName
              return (
                <div key={r.id} className="card flex justify-between px-4 py-3 text-sm">
                  <span>
                    #{r.index} {GAME_MAP[r.gameId].name}
                  </span>
                  <span className="text-lime">{name ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function SeasonTable({ members, me }: { members: Member[]; me: string }) {
  return (
    <div className="card divide-y divide-line">
      {members.map((m, i) => (
        <div key={m.uid} className={`flex items-center gap-3 px-4 py-3 ${m.uid === me ? 'bg-lime/5' : ''}`}>
          <span className="mono w-6 text-white/40">{i === 0 ? '👑' : i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{m.displayName}</p>
            <Streaks member={m} compact />
          </div>
          <div className="text-right">
            <p className="mono font-bold text-lime">{m.seasonPoints}</p>
            <p className="text-[11px] text-white/35">
              {m.wins}W · Elo {m.elo} · forma {formPoints(m.lastFivePoints)}
            </p>
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
  const rows = [...members].sort((a, b) => {
    const pa = snap.plays[a.uid]
    const pb = snap.plays[b.uid]
    if (!!pb?.finished !== !!pa?.finished) return pa?.finished ? -1 : 1
    if (pa?.best != null && pb?.best != null) {
      return GAME_MAP[snap.round.gameId].direction === 'lower' ? pa.best - pb.best : pb.best - pa.best
    }
    return 0
  })
  return (
    <div className="card divide-y divide-line">
      {rows.map((m) => {
        const play = snap.plays[m.uid]
        const score =
          play?.finished && play.best != null
            ? hideScores && m.uid !== me
              ? '•••'
              : String(play.best)
            : play?.official.length
              ? `${play.official.length} intento(s)`
              : 'Pendiente'
        return (
          <div key={m.uid} className="flex items-center justify-between px-4 py-3">
            <p className="font-bold">{m.displayName}</p>
            <p className="mono text-sm text-white/70">{score}</p>
          </div>
        )
      })}
    </div>
  )
}

function H2H({ me, members }: { me: Member; members: Member[] }) {
  const others = members.filter((m) => m.uid !== me.uid)
  if (!others.length) return <p className="text-white/50">Invita a alguien para ver duelos.</p>
  return (
    <div className="card divide-y divide-line">
      {others.map((o) => {
        const cell = me.h2h[o.uid] ?? { wins: 0, losses: 0 }
        return (
          <div key={o.uid} className="flex items-center justify-between px-4 py-3">
            <p className="font-bold">{o.displayName}</p>
            <p className="mono text-sm">
              <span className="text-lime">{cell.wins}</span>
              <span className="text-white/30"> — </span>
              <span className="text-pink">{cell.losses}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}

function Kings({ members }: { members: Member[] }) {
  const games = Object.values(GAME_MAP)
  return (
    <div className="space-y-2">
      {games.map((g) => {
        const king = [...members].sort((a, b) => (b.gameWins[g.id] ?? 0) - (a.gameWins[g.id] ?? 0))[0]
        const wins = king ? king.gameWins[g.id] ?? 0 : 0
        return (
          <div key={g.id} className="card flex items-center justify-between px-4 py-3 text-sm">
            <span>{g.name}</span>
            <span className="text-white/60">{wins ? `${king!.displayName} · ${wins}` : '—'}</span>
          </div>
        )
      })}
    </div>
  )
}
