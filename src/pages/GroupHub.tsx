import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Streaks } from '../components/Streaks'
import { Avatar, CodeChip, GameGlyph } from '../components/ui'
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
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">
            Temporada {snap.group.seasonNumber}
          </p>
          <h1 className="display text-3xl font-bold">{snap.group.name}</h1>
          <div className="mt-2">
            <CodeChip code={snap.group.code} />
          </div>
        </div>
        {session.uid === snap.group.createdBy && (
          <button className="text-xs font-extrabold text-white/35" onClick={() => void resetSeason()}>
            Reset
          </button>
        )}
      </div>

      <section className="card overflow-hidden p-4">
        <div className="flex items-center gap-3">
          <GameGlyph game={game} />
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/45">
              Ronda {snap.round.index} · {game.category}
            </p>
            <h2 className="display text-2xl font-bold">{game.name}</h2>
            <p className="text-sm text-white/65">{game.blurb}</p>
          </div>
        </div>
        {snap.members.length < 2 && (
          <p className="mt-3 rounded-2xl bg-cyan/15 px-3 py-2 text-sm font-bold text-cyan">
            Manda el código. La ronda espera a que se una alguien más.
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-sm font-extrabold text-white/60">
          <span>
            {finishedCount}/{snap.members.length} listos
          </span>
          <span>{game.direction === 'higher' ? '↑ más alto' : '↓ menos gana'}</span>
        </div>
        <div className="mt-3 flex -space-x-2">
          {snap.members.map((m) => (
            <div key={m.uid} className={snap.plays[m.uid]?.finished ? 'opacity-100' : 'opacity-35'}>
              <Avatar name={m.displayName} photo={m.photoURL} size={34} />
            </div>
          ))}
        </div>
        {!myTurnDone ? (
          <Link to={`/grupo/${groupId}/jugar`} className="btn btn-lime mt-4 w-full shine">
            ▶️ Jugar mi turno
          </Link>
        ) : (
          <p className="mt-4 text-center text-sm font-extrabold text-lime">Turno enviado. A esperar…</p>
        )}
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ronda', 'temporada', 'duelos', 'juegos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`display rounded-full px-4 py-1.5 text-sm font-bold capitalize ${
              tab === t ? 'bg-lime text-ink' : 'bg-[#2a1646] text-white/60'
            }`}
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
      {error && <p className="text-sm font-bold text-pink">{error}</p>}

      {snap.history.length > 0 && (
        <section>
          <h3 className="display mb-2 font-bold">Últimas rondas</h3>
          <div className="space-y-2">
            {snap.history.map((r) => {
              const meta = GAME_MAP[r.gameId]
              const winner = r.results?.[0]
              const name = table.find((m) => m.uid === winner?.uid)?.displayName
              return (
                <div key={r.id} className="card-flat flex items-center justify-between px-4 py-3">
                  <span className="flex items-center gap-2 font-extrabold">
                    <span>{meta.emoji}</span> #{r.index} {meta.name}
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
    <div className="space-y-2">
      {members.map((m, i) => (
        <div
          key={m.uid}
          className={`card flex items-center gap-3 p-3 ${i === 0 ? 'ring-2 ring-lime' : ''} ${m.uid === me ? 'outline outline-2 outline-pink/40' : ''}`}
        >
          <span className="display w-8 text-center text-xl font-bold">{i === 0 ? '👑' : i + 1}</span>
          <Avatar name={m.displayName} photo={m.photoURL} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold">{m.displayName}</p>
            <Streaks member={m} compact />
          </div>
          <div className="text-right">
            <p className="display text-2xl font-bold text-lime">{m.seasonPoints}</p>
            <p className="text-[11px] font-extrabold text-white/40">
              {m.wins}W · {m.elo} elo · {formPoints(m.lastFivePoints)} forma
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
    <div className="space-y-2">
      {rows.map((m) => {
        const play = snap.plays[m.uid]
        const score =
          play?.finished && play.best != null
            ? hideScores && m.uid !== me
              ? '•••'
              : String(play.best)
            : play?.official.length
              ? `${play.official.length} tiro(s)`
              : 'Esperando'
        return (
          <div key={m.uid} className="card-flat flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={m.displayName} photo={m.photoURL} size={38} />
              <p className="font-extrabold">{m.displayName}</p>
            </div>
            <p className="display font-bold text-lime">{score}</p>
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
    <div className="space-y-2">
      {others.map((o) => {
        const cell = me.h2h[o.uid] ?? { wins: 0, losses: 0 }
        return (
          <div key={o.uid} className="card-flat flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={o.displayName} photo={o.photoURL} size={38} />
              <p className="font-extrabold">{o.displayName}</p>
            </div>
            <p className="display text-lg font-bold">
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
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(GAME_MAP).map((g) => {
        const king = [...members].sort((a, b) => (b.gameWins[g.id] ?? 0) - (a.gameWins[g.id] ?? 0))[0]
        const wins = king ? king.gameWins[g.id] ?? 0 : 0
        return (
          <div key={g.id} className="card-flat p-3">
            <p className="text-2xl">{g.emoji}</p>
            <p className="display font-bold">{g.name}</p>
            <p className="text-xs font-extrabold text-white/50">{wins ? `${king!.displayName} · ${wins}` : 'sin rey'}</p>
          </div>
        )
      })}
    </div>
  )
}
