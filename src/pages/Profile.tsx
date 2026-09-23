import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui'
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
      <div className="flex justify-center">
        <Avatar name={name || '?'} photo={profile?.photoURL} size={88} />
      </div>
      <h1 className="display text-center text-4xl font-bold">Tu ficha</h1>
      <p className="text-center text-sm font-extrabold text-white/45">
        {isLocalMode() ? 'Modo local · este navegador' : `Cuenta ${session?.provider}`}
      </p>
      <input
        className="input text-center"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setSaved(false)
        }}
      />
      <button className="btn btn-lime w-full">Guardar apodo</button>
      {saved && <p className="text-center text-sm font-bold text-lime">¡Apodo actualizado!</p>}
    </form>
  )
}
