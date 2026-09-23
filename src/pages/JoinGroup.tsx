import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getStore } from '../store'

export function JoinGroup() {
  const { session, profile } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !profile) return
    setBusy(true)
    setError(null)
    try {
      const id = await getStore().joinGroup(session.uid, code, profile.displayName, profile.photoURL)
      nav(`/grupo/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <h1 className="text-3xl font-extrabold">Unirme</h1>
      <input
        className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-center font-mono text-2xl tracking-[0.35em] uppercase outline-none"
        placeholder="K7M2QX"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
      />
      <button className="btn btn-pink w-full" disabled={busy}>
        Entrar al grupo
      </button>
      {error && <p className="text-sm text-pink">{error}</p>}
    </form>
  )
}
