import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
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

  if (!snap || !session) return <p className="text-white/50">Cargando…</p>
  const game = GAME_MAP[snap.round.gameId]
  const play = snap.plays[session.uid]
  const practiceLeft = snap.group.settings.practiceEnabled && play?.practiceScore == null
  const officialLeft = snap.group.settings.officialAttempts - (play?.official.length ?? 0)

  if (play?.finished) {
    return (
      <div className="card space-y-3 p-5">
        <h1 className="text-2xl font-extrabold">Turno listo</h1>
        <p className="text-white/60">
          Mejor marca: <span className="mono text-lime">{play.best}</span>
        </p>
        <Link to={`/grupo/${groupId}`} className="btn btn-lime w-full">
          Volver al grupo
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
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>{game.name}</span>
          <span>{kind === 'practice' ? 'Práctica' : `Oficial ${ (play?.official.length ?? 0) + 1 }`}</span>
        </div>
        <GameHost id={snap.round.gameId} seed={snap.round.seed} onFinish={finish} />
      </div>
    )
  }

  if (phase === 'result' && lastScore != null) {
    return (
      <div className="card space-y-4 p-5">
        <p className="text-white/50">{kind === 'practice' ? 'Práctica' : 'Intento oficial'}</p>
        <p className="mono text-5xl font-bold text-lime">{lastScore}</p>
        {error && <p className="text-sm text-pink">{error}</p>}
        <div className="space-y-2">
          {officialLeft > 0 && (
            <button
              className="btn btn-lime w-full"
              onClick={() => {
                setKind('official')
                setPhase('live')
              }}
            >
              Siguiente intento oficial
            </button>
          )}
          <button className="btn btn-ghost w-full" onClick={() => nav(`/grupo/${groupId}`)}>
            Volver al grupo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to={`/grupo/${groupId}`} className="text-sm text-white/40">
        ← Grupo
      </Link>
      <div className="card p-5">
        <p className="text-xs uppercase tracking-wider text-white/40">{game.category}</p>
        <h1 className="text-3xl font-extrabold">{game.name}</h1>
        <p className="mt-2 text-white/65">{game.hint}</p>
        <p className="mt-3 text-sm text-white/45">
          {officialLeft} intento(s) oficial(es)
          {practiceLeft ? ' · 1 práctica gratis' : ''}
        </p>
      </div>
      {practiceLeft && (
        <button
          className="btn btn-ghost w-full"
          onClick={() => {
            setKind('practice')
            setPhase('live')
          }}
        >
          Practicar (no cuenta)
        </button>
      )}
      <button
        className="btn btn-lime w-full"
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
