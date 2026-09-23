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
      <p className="text-5xl">🔑</p>
      <h1 className="display text-4xl font-bold">Unirme</h1>
      <input
        className="input display text-center text-3xl tracking-[0.35em] uppercase"
        placeholder="K7M2QX"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
      />
      <button className="btn btn-pink w-full" disabled={busy}>
        Entrar a la liga
      </button>
      {error && <p className="text-sm font-bold text-pink">{error}</p>}
    </form>
  )
}
