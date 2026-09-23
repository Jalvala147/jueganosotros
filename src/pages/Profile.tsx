import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { isLocalMode } from '../lib/backend'

export function Profile() {
  const { profile, setNickname, session } = useAuth()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [saved, setSaved] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await setNickname(name)
    setSaved(true)
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4">
      <h1 className="text-3xl font-extrabold">Perfil</h1>
      <p className="text-sm text-white/45">
        {isLocalMode() ? 'Modo local (este navegador)' : `Sesión ${session?.provider}`}
      </p>
      <input
        className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setSaved(false)
        }}
      />
      <button className="btn btn-lime w-full">Guardar apodo</button>
      {saved && <p className="text-sm text-lime">Apodo actualizado</p>}
    </form>
  )
}
