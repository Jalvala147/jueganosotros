import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
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
      <div>
        <p className="text-white/45">Hola, {profile?.displayName}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Tus ligas</h1>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/crear" className="btn btn-lime">
          Crear grupo
        </Link>
        <Link to="/unirse" className="btn btn-ghost">
          Unirme con código
        </Link>
      </div>
      <div className="space-y-3">
        {groups.length === 0 && (
          <div className="card p-5 text-white/60">
            Aún no estás en ningún grupo. Crea uno e invita a tus amigos con el código.
          </div>
        )}
        {groups.map((g) => (
          <Link key={g.id} to={`/grupo/${g.id}`} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-extrabold">{g.name}</p>
              <p className="mono text-xs text-white/40">{g.code}</p>
            </div>
            <div className="text-right">
              <p className="mono text-lg font-semibold text-lime">{g.seasonPoints ?? 0}</p>
              <p className="text-[11px] text-white/35">pts temporada</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
