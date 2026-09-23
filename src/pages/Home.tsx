import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Avatar, FaceRow, GameArt } from '../components/ui'
import { emptyCareer, type Career } from '../lib/career'
import { GAME_MAP } from '../games/catalog'
import { getStore } from '../store'
import type { MyGroup } from '../store/types'

function badgeTone(rank: number) {
  if (rank === 1) return 'bg-pink text-white'
  if (rank === 2) return 'bg-yellow text-ink'
  if (rank === 3) return 'bg-purple text-white'
  return 'bg-mute text-white'
}

export function Home() {
  const { session, profile } = useAuth()
  const [groups, setGroups] = useState<MyGroup[]>([])
  const [career, setCareer] = useState<Career>(emptyCareer())

  useEffect(() => {
    if (!session) return
    return getStore().watchMyGroups(session.uid, setGroups)
  }, [session])

  useEffect(() => {
    if (!session) return
    return getStore().watchCareer(session.uid, setCareer)
  }, [session])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/55">¿Listo para la ronda?</p>
          <h1 className="display truncate text-4xl font-bold leading-none text-ink">{profile?.displayName}</h1>
        </div>
        <Avatar
          name={profile?.displayName ?? '?'}
          photo={profile?.photoURL}
          look={profile?.avatar}
          size={64}
          ring="#fff"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/crear" className="btn btn-pink min-h-28 w-full flex-col text-lg">
          <span className="text-2xl leading-none">＋</span>
          Crear grupo
        </Link>
        <Link to="/unirse" className="btn btn-yellow min-h-28 w-full flex-col text-lg">
          <span className="text-2xl leading-none">＃</span>
          Código
        </Link>
      </div>

      <Link to="/vitrina" className="card block p-4 no-underline">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">Tu vitrina</p>
            <p className="display text-2xl font-bold leading-none">
              {career.playStreak > 0 ? `Racha · día ${career.playStreak}` : 'Racha, marcas y juegos'}
            </p>
          </div>
          <span className="display grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[3px] border-ink bg-yellow text-xl font-bold">
            {career.wins}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Mini n={career.roundsPlayed} label="Partidas" />
          <Mini n={career.wins} label="Victorias" />
          <Mini n={career.rivals} label="Rivales" />
        </div>
      </Link>

      <h2 className="display text-3xl font-bold text-ink">Tus ligas</h2>
      <div className="space-y-3">
        {groups.length === 0 && (
          <div className="card-dark p-5 text-base font-bold">
            Aún no hay ligas. Crea un grupo, manda el código al WhatsApp y que empiece el caos.
          </div>
        )}
        {groups.map((g, i) => {
          const game = g.gameId ? GAME_MAP[g.gameId] : null
          const dark = i % 2 === 1
          return (
            <Link
              key={g.id}
              to={`/grupo/${g.id}`}
              className={`${dark ? 'card-dark' : 'card'} block overflow-hidden no-underline`}
            >
              {game ? (
                <GameArt game={game} className="h-32" />
              ) : (
                <div className="h-32 bg-gradient-to-br from-pink to-yellow" />
              )}
              <div className="px-4 pb-4">
                <div className="relative z-10 -mt-4 flex items-center justify-between gap-3">
                  <FaceRow people={g.members} ring={dark ? '#4C4660' : '#fff'} />
                  <span
                    className={`display grid h-12 min-w-12 shrink-0 place-items-center rounded-2xl border-[3px] border-ink px-2 text-lg font-bold ${badgeTone(g.rank)}`}
                  >
                    #{g.rank}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="display truncate text-2xl font-bold">{g.name}</p>
                    <p className="text-[11px] font-black tracking-[0.18em] opacity-60">{g.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="display text-4xl font-bold leading-none">{g.seasonPoints ?? 0}</p>
                    <p className="text-[11px] font-black uppercase opacity-60">pts</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Mini({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-[#fff8ee] px-2 py-2">
      <p className="display text-xl font-bold leading-none">{n}</p>
      <p className="text-[10px] font-black uppercase text-ink/50">{label}</p>
    </div>
  )
}
