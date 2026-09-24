import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LeagueAlerts } from './LeagueAlerts'
import { Avatar } from './ui'

export function Layout() {
  const { profile, signOut } = useAuth()
  return (
    <div className="relative min-h-dvh">
      <header className="topbar sticky top-0 z-30">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2.5">
          <Link to="/" className="display min-w-0 flex-1 truncate text-2xl font-bold leading-none text-ink no-underline">
            Juega<span className="text-pink">Nosotros</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <NavLink to="/perfil" aria-label="Perfil" className="grid h-12 w-12 place-items-center">
              <Avatar
                name={profile?.displayName ?? '?'}
                photo={profile?.photoURL}
                picture={profile?.customPhotoURL}
                look={profile?.avatar}
                size={44}
                ring="#ff4571"
              />
            </NavLink>
            <button
              className="min-h-12 rounded-full border-[3px] border-ink bg-white px-4 text-sm font-black text-ink"
              onClick={() => void signOut()}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-[max(7rem,env(safe-area-inset-bottom))] pt-5">
        {profile && <LeagueAlerts uid={profile.uid} />}
        <Outlet />
      </main>
    </div>
  )
}
