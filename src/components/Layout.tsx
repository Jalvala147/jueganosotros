import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function Layout() {
  const { profile, signOut } = useAuth()
  return (
    <div className="min-h-dvh grain">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-ink/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            Juega<span className="text-lime">Nosotros</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <NavLink to="/perfil" className="text-white/70">
              {profile?.displayName ?? 'Perfil'}
            </NavLink>
            <button className="text-white/40" onClick={() => void signOut()}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 pb-24 pt-5">
        <Outlet />
      </main>
    </div>
  )
}
