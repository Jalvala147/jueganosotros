import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getStore } from '../store'

export function CreateGroup() {
  const { session, profile } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !profile) return
    setBusy(true)
    setError(null)
    try {
      const id = await getStore().createGroup(session.uid, name, profile.displayName, profile.photoURL)
      nav(`/grupo/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <p className="text-5xl">🚀</p>
      <h1 className="display text-4xl font-bold">Nueva liga</h1>
      <p className="text-white/70">Te sale un código de 6 letras. Lo mandas y que se unan.</p>
      <input
        className="input"
        placeholder="Ej. Los del piso"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button className="btn btn-lime w-full" disabled={busy}>
        Crear y abrir ronda 1
      </button>
      {error && <p className="text-sm font-bold text-pink">{error}</p>}
    </form>
  )
}
