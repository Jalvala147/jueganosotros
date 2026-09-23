import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui'
import { getStore } from '../store'

export function Home() {
  const { session, profile } = useAuth()
  const [groups, setGroups] = useState<{ id: string; name: string; code: string; seasonPoints?: number }[]>([])

  useEffect(() => {
    if (!session) return
    return getStore().watchMyGroups(session.uid, setGroups)
  }, [session])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Avatar name={profile?.displayName ?? '?'} photo={profile?.photoURL} size={56} />
        <div>
          <p className="text-sm font-bold text-white/50">¿Listo para la ronda?</p>
          <h1 className="display text-3xl font-bold">{profile?.displayName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/crear" className="card flex min-h-32 flex-col justify-between p-4">
          <span className="text-3xl">🚀</span>
          <span className="display text-lg font-bold">Crear grupo</span>
        </Link>
        <Link to="/unirse" className="card flex min-h-32 flex-col justify-between p-4">
          <span className="text-3xl">🔑</span>
          <span className="display text-lg font-bold">Código</span>
        </Link>
      </div>

      <h2 className="display text-xl font-bold">Tus ligas</h2>
      <div className="space-y-3">
        {groups.length === 0 && (
          <div className="card p-5 text-white/70">
            Aún no hay ligas. Crea un grupo, manda el código al WhatsApp y que empiece el caos.
          </div>
        )}
        {groups.map((g, i) => (
          <Link
            key={g.id}
            to={`/grupo/${g.id}`}
            className="card flex items-center justify-between overflow-hidden p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                style={{ background: ['#ff3d8f', '#c6ff3d', '#3ef0ff', '#ff8a1f'][i % 4] }}
              >
                {['👑', '🔥', '⚡', '🎯'][i % 4]}
              </div>
              <div>
                <p className="display text-lg font-bold">{g.name}</p>
                <p className="mono text-xs text-white/45">{g.code}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="display text-2xl font-bold text-lime">{g.seasonPoints ?? 0}</p>
              <p className="text-[11px] font-extrabold uppercase text-white/40">pts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
