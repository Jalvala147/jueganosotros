import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { StickMark } from '../components/ui'
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
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <div className="relative z-10 pop">
        <div className="mb-5 flex justify-center">
          <StickMark size={112} />
        </div>
        <p className="display text-center text-xs font-bold uppercase tracking-[0.28em] text-ink/55">
          liga de minijuegos
        </p>
        <h1 className="display mt-2 text-center text-5xl font-bold leading-none text-ink sm:text-6xl">
          Juega
          <br />
          <span className="text-pink">Nosotros</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-center text-base font-bold text-ink/75">
          18 minijuegos. La misma partida para tu grupo. La siguiente ronda sale cuando todos
          hayan jugado, no cada 24 horas.
        </p>

        <div className="mt-8 space-y-3">
          <button className="btn btn-pink w-full" disabled={busy || local} onClick={() => void run(signInGoogle)}>
            Entrar con Google
          </button>
          <button className="btn btn-yellow w-full" disabled={busy || local} onClick={() => void run(signInApple)}>
            Entrar con Apple
          </button>
          {local && (
            <div className="card p-4">
              <p className="text-sm font-black text-pink">Modo prueba (sin Firebase)</p>
              <p className="mt-1 text-sm font-bold text-ink/70">
                Abre otra pestaña, entra con otro apodo y únete al mismo código. Cuando quieras
                Google y Apple, sigue los pasos de <span className="text-pink">FIREBASE.md</span>.
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
        {error && <p className="mt-4 text-center text-sm font-black text-pink">{error}</p>}
      </div>
    </div>
  )
}
