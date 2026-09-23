import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { GamePreview } from '../components/GamePreview'
import { GameHost } from '../games/Host'
import { GAME_MAP } from '../games/catalog'
import { getStore } from '../store'
import type { GroupSnapshot } from '../types'

export function Play() {
  const { groupId = '' } = useParams()
  const { session } = useAuth()
  const nav = useNavigate()
  const [snap, setSnap] = useState<GroupSnapshot | null>(null)
  const [phase, setPhase] = useState<'ready' | 'live' | 'result'>('ready')
  const [kind, setKind] = useState<'practice' | 'official'>('official')
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return getStore().watchGroup(groupId, setSnap)
  }, [groupId])

  if (!snap || !session) return <p className="font-black text-ink/60">Cargando…</p>
  const game = GAME_MAP[snap.round.gameId]
  const play = snap.plays[session.uid]
  const practiceLeft = snap.group.settings.practiceEnabled && play?.practiceScore == null
  const officialLeft = snap.group.settings.officialAttempts - (play?.official.length ?? 0)

  if (play?.finished) {
    return (
      <div className="card pop space-y-3 p-6 text-center">
        <p className="text-5xl">🏆</p>
        <h1 className="display text-4xl font-bold leading-none">¡Turno listo!</h1>
        <p className="font-bold text-ink/70">
          Mejor marca: <span className="display text-4xl text-pink">{play.best}</span>
        </p>
        <Link to={`/grupo/${groupId}`} className="btn btn-pink w-full">
          Volver a la liga
        </Link>
      </div>
    )
  }

  async function finish(score: number) {
    setLastScore(score)
    setPhase('result')
    setError(null)
    try {
      await getStore().submitPlay(groupId, snap!.round.id, session!.uid, kind, score)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se guardó')
    }
  }

  if (phase === 'live') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-sm font-black text-ink/70">
          <span className="flex min-w-0 items-center gap-2">
            <GamePreview id={game.id} className="h-10 w-10 shrink-0 rounded-xl" />
            <span className="truncate">{game.name}</span>
          </span>
          <span className="shrink-0 rounded-full border-[3px] border-ink bg-pink px-2 py-0.5 text-xs text-white">
            {kind === 'practice' ? 'Práctica' : `Oficial ${(play?.official.length ?? 0) + 1}`}
          </span>
        </div>
        <GameHost id={snap.round.gameId} seed={snap.round.seed} onFinish={finish} />
      </div>
    )
  }

  if (phase === 'result' && lastScore != null) {
    return (
      <div className="card pop space-y-4 p-6 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-ink/45">
          {kind === 'practice' ? 'Práctica' : 'Intento oficial'}
        </p>
        <p className="display text-7xl font-bold leading-none text-pink">{lastScore}</p>
        {error && <p className="text-sm font-black text-pink">{error}</p>}
        <div className="space-y-2">
          {officialLeft > 0 && (
            <button
              className="btn btn-pink w-full"
              onClick={() => {
                setKind('official')
                setPhase('live')
              }}
            >
              Otro intento oficial
            </button>
          )}
          <button className="btn btn-ghost w-full" onClick={() => nav(`/grupo/${groupId}`)}>
            Volver a la liga
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to={`/grupo/${groupId}`} className="text-sm font-black text-ink/60 no-underline">
        ← Liga
      </Link>
      <div className="card overflow-hidden">
        <div className="relative">
          <GamePreview id={game.id} className="h-56" />
          <p className="absolute left-3 top-3 rounded-full border-[3px] border-ink bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wide">
            {game.category}
          </p>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-10">
            <h1 className="display break-words text-4xl font-bold leading-none text-white">{game.name}</h1>
          </div>
        </div>
        <p className="p-4 font-bold text-ink/70">{game.hint}</p>
      </div>
      <p className="text-center text-sm font-black text-ink/60">
        {officialLeft} intento(s) oficial(es)
        {practiceLeft ? ' · 1 práctica gratis' : ''}
      </p>
      {practiceLeft && (
        <button
          className="btn btn-yellow w-full"
          onClick={() => {
            setKind('practice')
            setPhase('live')
          }}
        >
          Calentar (no cuenta)
        </button>
      )}
      <button
        className="btn btn-pink w-full"
        disabled={officialLeft <= 0}
        onClick={() => {
          setKind('official')
          setPhase('live')
        }}
      >
        Jugar oficial
      </button>
    </div>
  )
}
