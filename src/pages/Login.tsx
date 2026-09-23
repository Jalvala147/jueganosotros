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
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5">
      <p className="mono text-xs uppercase tracking-[0.25em] text-lime">liga de minijuegos</p>
      <h1 className="mt-3 text-5xl font-extrabold leading-[0.95] tracking-tight">
        Juega
        <br />
        <span className="text-lime">Nosotros</span>
      </h1>
      <p className="mt-4 max-w-sm text-white/65">
        Veinte minijuegos. Misma partida para todo el grupo. La siguiente ronda sale cuando
        todos hayan jugado — no cada 24 horas.
      </p>

      <div className="mt-8 space-y-3">
        <button className="btn btn-lime w-full" disabled={busy || local} onClick={() => void run(signInGoogle)}>
          Entrar con Google
        </button>
        <button className="btn btn-ghost w-full" disabled={busy || local} onClick={() => void run(signInApple)}>
          Entrar con Apple
        </button>
        {local && (
          <div className="card p-4">
            <p className="text-sm text-white/70">
              Firebase aún no está conectado. Puedes probar ya en este dispositivo: abre otra
              pestaña, entra con otro apodo y únete al mismo código.
            </p>
            <input
              className="mt-3 w-full rounded-2xl border border-line bg-ink px-4 py-3 outline-none"
              placeholder="Tu apodo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="btn btn-pink mt-3 w-full"
              disabled={busy}
              onClick={() => void run(() => signInLocal(name))}
            >
              Probar sin cuenta
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-pink">{error}</p>}
    </div>
  )
}
