import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Streaks } from '../components/Streaks'
import { Avatar, CodeChip, GameArt, GameGlyph, rankTone } from '../components/ui'
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
    return <p className="font-black text-ink/60">Cargando grupo…</p>
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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-ink/50">
            Temporada {snap.group.seasonNumber}
          </p>
          <h1 className="display text-5xl font-bold leading-[0.88] text-ink">{snap.group.name}</h1>
          <div className="mt-3">
            <CodeChip code={snap.group.code} />
          </div>
        </div>
        {session.uid === snap.group.createdBy && (
          <button
            className="rounded-full border-[3px] border-ink bg-white px-3 py-1 text-xs font-black text-ink"
            onClick={() => void resetSeason()}
          >
            Reset
          </button>
        )}
      </div>

      <section className="card overflow-hidden">
        <GameArt game={game} className="h-28" />
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <GameGlyph game={game} size={58} />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-ink/45">
                Ronda {snap.round.index} · {game.category}
              </p>
              <h2 className="display text-3xl font-bold leading-none">{game.name}</h2>
            </div>
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
            <span>{game.direction === 'higher' ? '↑ más alto' : '↓ menos gana'}</span>
          </div>
          <div className="flex -space-x-2">
            {snap.members.map((m) => (
              <div key={m.uid} className={snap.plays[m.uid]?.finished ? 'opacity-100' : 'opacity-40'}>
                <Avatar name={m.displayName} photo={m.photoURL} size={34} ring="#fff" />
              </div>
            ))}
          </div>
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ronda', 'temporada', 'duelos', 'juegos'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`display shrink-0 rounded-full border-[3px] border-ink px-4 py-1.5 text-sm font-bold capitalize ${
              tab === t ? 'bg-pink text-white shadow-[0_4px_0_#1c1430]' : 'bg-mute text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'ronda' && (
        <RoundTable members={table} snap={snap} hideScores={hideScores} me={session.uid} />
      )}
      {tab === 'temporada' && <SeasonBoard members={table} me={session.uid} />}
      {tab === 'duelos' && me && <H2H me={me} members={table} />}
      {tab === 'juegos' && <Kings members={table} />}

      {(timedOut || session.uid === snap.group.createdBy) && (
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
              const meta = GAME_MAP[r.gameId]
              const winner = r.results?.[0]
              const name = table.find((m) => m.uid === winner?.uid)?.displayName
              return (
                <div key={r.id} className="score-row flex items-center justify-between bg-mute px-3 py-2 text-white">
                  <span className="flex min-w-0 items-center gap-2 font-extrabold">
                    <GameGlyph game={meta} size={42} />
                    <span className="truncate">
                      #{r.index} {meta.name}
                    </span>
                  </span>
                  <span className="display shrink-0 font-bold text-yellow">{name ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function Podium({ members, me }: { members: Member[]; me: string }) {
  const top = members.slice(0, 3)
  if (top.length < 2) return null
  const slots =
    top.length > 2
      ? [
          { m: top[1]!, place: 2, h: 'min-h-32', tone: 'bg-yellow text-ink' },
          { m: top[0]!, place: 1, h: 'min-h-40', tone: 'bg-pink text-white' },
          { m: top[2]!, place: 3, h: 'min-h-28', tone: 'bg-purple text-white' },
        ]
      : [
          { m: top[1]!, place: 2, h: 'min-h-32', tone: 'bg-yellow text-ink' },
          { m: top[0]!, place: 1, h: 'min-h-40', tone: 'bg-pink text-white' },
        ]
  return (
    <div className="flex items-end gap-2">
      {slots.map(({ m, place, h, tone }) => (
        <div
          key={m.uid}
          className={`score-row flex flex-1 flex-col items-center justify-end px-1 pb-3 pt-3 ${h} ${tone} ${
            m.uid === me ? 'outline outline-[3px] outline-offset-2 outline-ink' : ''
          }`}
        >
          <span className="display text-xs font-bold opacity-80">#{place}</span>
          <Avatar name={m.displayName} photo={m.photoURL} size={36} ring="transparent" />
          <p className="mt-1 w-full truncate text-center text-xs font-black">{m.displayName}</p>
          <p className="display text-3xl font-bold leading-none">{m.seasonPoints}</p>
        </div>
      ))}
    </div>
  )
}

function SeasonBoard({ members, me }: { members: Member[]; me: string }) {
  return (
    <div className="space-y-2">
      <Podium members={members} me={me} />
      {members.map((m, i) => (
        <div
          key={m.uid}
          className={`score-row flex items-center gap-3 px-3 py-3 ${rankTone(i)} ${
            m.uid === me ? 'outline outline-[3px] outline-offset-2 outline-ink' : ''
          }`}
        >
          <span className="display w-8 text-center text-2xl font-bold">{i + 1}</span>
          <Avatar name={m.displayName} photo={m.photoURL} size={40} ring="transparent" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-black">
              {m.displayName}
              {m.uid === me && (
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase text-ink">
                  tú
                </span>
              )}
            </p>
            <Streaks member={m} compact />
            <p className="text-[11px] font-extrabold opacity-75">
              {m.wins}W · {m.elo} elo · {formPoints(m.lastFivePoints)} forma
            </p>
          </div>
          <p className="display text-4xl font-bold leading-none">{m.seasonPoints}</p>
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
      {rows.map((m, i) => {
        const play = snap.plays[m.uid]
        const score =
          play?.finished && play.best != null
            ? hideScores && m.uid !== me
              ? '•••'
              : String(play.best)
            : play?.official.length
              ? `${play.official.length} tiro(s)`
              : 'Esperando'
        const big = score === '•••' || /^\d/.test(score)
        return (
          <div
            key={m.uid}
            className={`score-row flex items-center justify-between gap-3 px-3 py-3 ${rankTone(i)}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="display w-6 text-center text-xl font-bold">{i + 1}</span>
              <Avatar name={m.displayName} photo={m.photoURL} size={38} ring="transparent" />
              <p className="truncate font-black">{m.displayName}</p>
            </div>
            <p className={big ? 'display text-4xl font-bold leading-none' : 'text-xs font-black uppercase'}>
              {score}
            </p>
          </div>
        )
      })}
    </div>
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
          <div key={o.uid} className="score-row flex items-center justify-between bg-mute px-3 py-3 text-white">
            <div className="flex items-center gap-3">
              <Avatar name={o.displayName} photo={o.photoURL} size={38} ring="#4C4660" />
              <p className="font-black">{o.displayName}</p>
            </div>
            <p className="display text-3xl font-bold leading-none">
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

function Kings({ members }: { members: Member[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(GAME_MAP).map((g) => {
        const king = [...members].sort((a, b) => (b.gameWins[g.id] ?? 0) - (a.gameWins[g.id] ?? 0))[0]
        const wins = king ? (king.gameWins[g.id] ?? 0) : 0
        return (
          <div key={g.id} className="card p-3">
            <GameGlyph game={g} size={48} />
            <p className="display mt-2 font-bold leading-none">{g.name}</p>
            <p className="mt-1 text-xs font-extrabold text-ink/55">
              {wins ? `${king!.displayName} · ${wins}` : 'sin rey'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
