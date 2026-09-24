import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { GamePreview } from '../components/GamePreview'
import { GameHost } from '../games/Host'
import { findGame } from '../games/catalog'
import { attemptSeed } from '../lib/rng'
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
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return getStore().watchGroup(groupId, setSnap)
  }, [groupId])

  if (!snap || !session) return <p className="font-black text-ink/60">Cargando…</p>
  const game = findGame(snap.round.gameId)
  const play = snap.plays[session.uid]
  const practiceLeft = snap.group.settings.practiceEnabled && play?.practiceScore == null
  const totalAttempts = snap.group.settings.officialAttempts || 2
  const officialLeft = totalAttempts - (play?.official.length ?? 0)
  const nextAttempt = Math.min((play?.official.length ?? 0) + 1, totalAttempts)

  if (!game) {
    return (
      <div className="card space-y-3 p-6">
        <p className="text-lg font-extrabold leading-snug text-ink">Este juego ya no está.</p>
        <p className="font-bold leading-relaxed text-ink/70">
          Vuelve a la liga y cierren la ronda para pasar a la siguiente.
        </p>
        <Link to={`/grupo/${groupId}`} className="btn btn-pink w-full">
          Volver a la liga
        </Link>
      </div>
    )
  }

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
          <span className="display shrink-0 rounded-full border-[3px] border-ink bg-pink px-3 py-1 text-sm font-bold text-white">
            {kind === 'practice' ? 'Práctica' : `Intento ${attempt + 1}/${totalAttempts}`}
          </span>
        </div>
        <GameHost
          id={snap.round.gameId}
          seed={attemptSeed(snap.round.seed, kind === 'practice' ? 9 : attempt)}
          onFinish={finish}
        />
      </div>
    )
  }

  if (phase === 'result' && lastScore != null) {
    return (
      <div className="card pop space-y-4 p-6 text-center">
        <p className="display text-2xl font-bold leading-none text-ink">
          {kind === 'practice' ? 'Práctica' : `Intento ${attempt + 1}/${totalAttempts}`}
        </p>
        <p className="display text-7xl font-bold leading-none text-pink">{lastScore}</p>
        {error && <p className="text-sm font-black text-pink">{error}</p>}
        <div className="space-y-2">
          {attempt === 0 && officialLeft > 0 && (
            <button
              className="btn btn-pink w-full"
              onClick={() => {
                setKind('official')
                setAttempt((n) => n + 1)
                setPhase('live')
              }}
            >
              Intento {attempt + 2}/{totalAttempts}
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
            <h1 className="display break-words text-3xl font-bold leading-tight text-white">{game.name}</h1>
          </div>
        </div>
        <p className="p-4 text-[17px] font-extrabold leading-relaxed break-words text-ink/80">{game.guide}</p>
      </div>
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
          setAttempt(play?.official.length ?? 0)
          setPhase('live')
        }}
      >
        Intento {nextAttempt}/{totalAttempts}
      </button>
    </div>
  )
}
