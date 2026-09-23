import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { isLocalMode } from '../lib/backend'

export function Login() {
  const { session, loading, signInGoogle, signInApple, signInLocal } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const local = isLocalMode()

  if (!loading && session) return <Navigate to="/" replace />

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo entrar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center overflow-hidden px-5 py-10">
      <div className="blob -left-8 top-10 h-32 w-32 rounded-full bg-pink" />
      <div className="blob right-0 top-24 h-24 w-24 rounded-full bg-lime" />
      <div className="blob bottom-20 left-16 h-20 w-20 rounded-full bg-cyan" />

      <div className="relative z-10 pop">
        <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-lime to-cyan shadow-[0_10px_0_#3d6b00]">
          <span className="text-6xl">🎮</span>
        </div>
        <p className="display text-center text-xs font-semibold uppercase tracking-[0.28em] text-lime">
          liga de minijuegos
        </p>
        <h1 className="display mt-2 text-center text-6xl font-bold leading-[0.9]">
          Juega
          <br />
          <span className="text-lime">Nosotros</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-center text-white/75">
          20 minijuegos. Misma partida para tu grupo. La siguiente ronda sale cuando todos
          hayan jugado — no cada 24 horas.
        </p>

        <div className="mt-8 space-y-3">
          <button className="btn btn-lime w-full" disabled={busy || local} onClick={() => void run(signInGoogle)}>
            <span>🟢</span> Entrar con Google
          </button>
          <button className="btn btn-ghost w-full" disabled={busy || local} onClick={() => void run(signInApple)}>
            <span></span> Entrar con Apple
          </button>
          {local && (
            <div className="card p-4">
              <p className="text-sm font-bold text-orange">Modo prueba (sin Firebase)</p>
              <p className="mt-1 text-sm text-white/70">
                Abre otra pestaña, entra con otro apodo y únete al mismo código. Cuando quieras
                Google y Apple, sigue los pasos de <span className="text-lime">FIREBASE.md</span>.
              </p>
              <input
                className="input mt-3"
                placeholder="Tu apodo de batalla"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="btn btn-pink mt-3 w-full"
                disabled={busy}
                onClick={() => void run(() => signInLocal(name))}
              >
                ¡A jugar!
              </button>
            </div>
          )}
        </div>
        {error && <p className="mt-4 text-center text-sm font-bold text-pink">{error}</p>}
      </div>
    </div>
  )
}
