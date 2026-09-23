import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from './ui'

export function Layout() {
  const { profile, signOut } = useAuth()
  return (
    <div className="relative min-h-dvh">
      <div className="blob left-[-40px] top-16 h-36 w-36 rounded-full bg-pink/70" />
      <div className="blob right-[-30px] top-40 h-28 w-28 rounded-full bg-lime/50" style={{ animationDelay: '1.2s' }} />
      <div className="blob bottom-10 left-10 h-24 w-24 rounded-full bg-cyan/40" style={{ animationDelay: '2s' }} />
      <header className="sticky top-0 z-20 bg-[#14081f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link to="/" className="display text-xl font-bold tracking-tight">
            Juega<span className="text-lime">Nosotros</span>
          </Link>
          <div className="flex items-center gap-3">
            <NavLink to="/perfil" className="flex items-center gap-2">
              <Avatar name={profile?.displayName ?? '?'} photo={profile?.photoURL} size={36} />
            </NavLink>
            <button className="text-xs font-extrabold text-white/45" onClick={() => void signOut()}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-lg px-4 pb-24 pt-4">
        <Outlet />
      </main>
    </div>
  )
}
