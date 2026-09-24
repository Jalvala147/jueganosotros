import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui'
import { isLocalMode } from '../lib/backend'

export function Profile() {
  const { profile, setNickname, setPhoto, session } = useAuth()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!touched && profile?.displayName) setName(profile.displayName)
  }, [profile?.displayName, touched])

  useEffect(() => {
    if (!preview || preview === profile?.customPhotoURL) return
    if (!profile?.customPhotoURL) return
    URL.revokeObjectURL(preview)
    setPreview(null)
  }, [profile?.customPhotoURL, preview])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await setNickname(name)
    setSaved(true)
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    setPhotoError('')
    setPhotoBusy(true)
    const local = URL.createObjectURL(file)
    setPreview(local)
    try {
      await setPhoto(file)
    } catch {
      setPhotoError('No se pudo guardar la foto. Usa JPG o PNG.')
      URL.revokeObjectURL(local)
      setPreview(null)
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="display text-center text-4xl font-bold leading-none text-ink">Tu ficha</h1>
      <Link to="/vitrina" className="btn btn-yellow w-full">
        Ver tu vitrina
      </Link>
      <form onSubmit={(e) => void save(e)} className="card space-y-4 p-5">
        <div className="flex justify-center">
          <Avatar
            name={name || '?'}
            photo={profile?.photoURL}
            picture={preview || profile?.customPhotoURL}
            look={profile?.avatar}
            size={112}
            ring="#ff4571"
          />
        </div>
        <label className={`btn btn-yellow w-full ${photoBusy ? 'pointer-events-none opacity-60' : ''}`}>
          {photoBusy ? 'Subiendo…' : 'Subir foto'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={photoBusy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              void onPhoto(file)
            }}
          />
        </label>
        {profile?.customPhotoURL && (
          <button
            type="button"
            className="btn btn-ghost w-full"
            disabled={photoBusy}
            onClick={() => void setPhoto(null).then(() => setPreview(null))}
          >
            Quitar foto
          </button>
        )}
        {photoError && <p className="text-center text-sm font-black text-pink">{photoError}</p>}
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
      </form>
    </div>
  )
}
