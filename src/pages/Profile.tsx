import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui'
import { isLocalMode } from '../lib/backend'

export function Profile() {
  const { profile, setNickname, session } = useAuth()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!touched && profile?.displayName) setName(profile.displayName)
  }, [profile?.displayName, touched])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await setNickname(name)
    setSaved(true)
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4">
      <h1 className="display text-center text-5xl font-bold leading-none text-ink">Tu ficha</h1>
      <div className="card space-y-4 p-5">
        <div className="flex justify-center">
          <Avatar name={name || '?'} photo={profile?.photoURL} size={96} ring="#ff4571" />
        </div>
        <p className="text-center text-sm font-black text-ink/50">
          {isLocalMode() ? 'Modo local · este navegador' : `Cuenta ${session?.provider}`}
        </p>
        <input
          className="input text-center text-lg"
          value={name}
          onChange={(e) => {
            setTouched(true)
            setName(e.target.value)
            setSaved(false)
          }}
        />
        <button className="btn btn-pink w-full">Guardar apodo</button>
        {saved && <p className="text-center text-sm font-black text-pink">¡Apodo actualizado!</p>}
      </div>
    </form>
  )
}
