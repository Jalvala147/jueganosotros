import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { StickMark } from '../components/ui'
import { getStore } from '../store'

export function CreateGroup() {
  const { session, profile } = useAuth()
  const [name, setName] = useState('')
  const [changeAt, setChangeAt] = useState('21:00')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !profile) return
    setBusy(true)
    setError(null)
    try {
      const [hour, minute] = changeAt.split(':').map((part) => Number(part))
      const changeMinutes = (hour || 0) * 60 + (minute || 0)
      const id = await getStore().createGroup(
        session.uid,
        name,
        profile.displayName,
        profile.photoURL,
        profile.avatar,
        changeMinutes,
      )
      nav(`/grupo/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5">
      <StickMark />
      <h1 className="display text-5xl font-bold leading-none text-ink">Nueva liga</h1>
      <p className="text-lg font-bold text-ink/70">Te sale un código de 6 letras. Lo mandas y que se unan.</p>
      <input
        className="input text-lg"
        placeholder="Ej. La banda"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <label className="block space-y-2">
        <span className="text-sm font-black text-ink/70">Hora en la que cambia el juego solo</span>
        <input
          className="input text-lg"
          type="time"
          value={changeAt}
          onChange={(e) => setChangeAt(e.target.value)}
          required
        />
      </label>
      <button className="btn btn-pink w-full" disabled={busy}>
        Crear y abrir ronda 1
      </button>
      {error && <p className="text-sm font-black text-pink">{error}</p>}
    </form>
  )
}
