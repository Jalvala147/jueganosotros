import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from './ui'

export function Layout() {
  const { profile, signOut } = useAuth()
  return (
    <div className="relative min-h-dvh">
      <header className="topbar sticky top-0 z-30">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link to="/" className="display text-[1.65rem] font-bold leading-none text-ink no-underline">
            Juega<span className="text-pink">Nosotros</span>
          </Link>
          <div className="flex items-center gap-2">
            <NavLink to="/perfil" aria-label="Perfil">
              <Avatar name={profile?.displayName ?? '?'} photo={profile?.photoURL} size={40} ring="#ff4571" />
            </NavLink>
            <button
              className="rounded-full border-[3px] border-ink bg-white px-3 py-1.5 text-xs font-black text-ink"
              onClick={() => void signOut()}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-16 pt-5">
        <Outlet />
      </main>
    </div>
  )
}
