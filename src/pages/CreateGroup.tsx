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
      <h1 className="text-3xl font-extrabold">Nuevo grupo</h1>
      <p className="text-white/60">Saldrá un código de 6 letras para que se unan tus amigos.</p>
      <input
        className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
        placeholder="Ej. Los del piso"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button className="btn btn-lime w-full" disabled={busy}>
        Crear y empezar ronda 1
      </button>
      {error && <p className="text-sm text-pink">{error}</p>}
    </form>
  )
}
