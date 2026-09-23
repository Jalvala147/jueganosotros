import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui'
import { isLocalMode } from '../lib/backend'
import {
  BGS,
  EXTRA_LABELS,
  EYE_LABELS,
  HAIR_COLORS,
  HAIR_LABELS,
  MOUTH_LABELS,
  SKINS,
  cycleAvatar,
  defaultAvatar,
  hashName,
  randomAvatar,
  type AvatarLook,
} from '../lib/avatar'

const FIELDS: { key: keyof AvatarLook; label: string; text: (look: AvatarLook) => string; swatch?: (look: AvatarLook) => string }[] = [
  { key: 'bg', label: 'Fondo', text: () => 'Color', swatch: (look) => BGS[look.bg % BGS.length]! },
  { key: 'skin', label: 'Piel', text: () => 'Tono', swatch: (look) => SKINS[look.skin % SKINS.length]! },
  { key: 'hair', label: 'Pelo', text: (look) => HAIR_LABELS[look.hair % HAIR_LABELS.length]! },
  { key: 'hairColor', label: 'Color', text: () => 'Tinte', swatch: (look) => HAIR_COLORS[look.hairColor % HAIR_COLORS.length]! },
  { key: 'eyes', label: 'Ojos', text: (look) => EYE_LABELS[look.eyes % EYE_LABELS.length]! },
  { key: 'mouth', label: 'Boca', text: (look) => MOUTH_LABELS[look.mouth % MOUTH_LABELS.length]! },
  { key: 'accessory', label: 'Extra', text: (look) => EXTRA_LABELS[look.accessory % EXTRA_LABELS.length]! },
]

export function Profile() {
  const { profile, setNickname, setAvatar, session } = useAuth()
  const [name, setName] = useState(profile?.displayName ?? '')
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)
  const [look, setLook] = useState<AvatarLook>(() => defaultAvatar(hashName(profile?.displayName ?? 'yo')))
  const [lookTouched, setLookTouched] = useState(false)
  const [lookSaved, setLookSaved] = useState(false)

  useEffect(() => {
    if (!touched && profile?.displayName) setName(profile.displayName)
  }, [profile?.displayName, touched])

  useEffect(() => {
    if (lookTouched || !profile) return
    setLook(profile.avatar ?? defaultAvatar(hashName(profile.displayName)))
  }, [profile, lookTouched])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await setNickname(name)
    setSaved(true)
  }

  async function saveLook() {
    await setAvatar(look)
    setLookSaved(true)
  }

  return (
    <div className="space-y-4">
      <h1 className="display text-center text-4xl font-bold leading-none text-ink">Tu ficha</h1>
      <form onSubmit={(e) => void save(e)} className="card space-y-4 p-5">
        <div className="flex justify-center">
          <Avatar name={name || '?'} photo={profile?.photoURL} look={look} size={112} ring="#ff4571" />
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
      </form>

      <section className="card space-y-3 p-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink/45">Creador</p>
          <h2 className="display text-3xl font-bold leading-none">Tu avatar</h2>
        </div>
        <div className="space-y-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-black uppercase tracking-wide text-ink/55">{field.label}</span>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-white text-lg font-black"
                aria-label={`${field.label} anterior`}
                onClick={() => {
                  setLookTouched(true)
                  setLookSaved(false)
                  setLook((current) => cycleAvatar(current, field.key, -1))
                }}
              >
                ‹
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border-[3px] border-ink bg-white px-3 py-2">
                {field.swatch && (
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border-2 border-ink"
                    style={{ background: field.swatch(look) }}
                  />
                )}
                <span className="truncate text-sm font-black">{field.text(look)}</span>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-white text-lg font-black"
                aria-label={`${field.label} siguiente`}
                onClick={() => {
                  setLookTouched(true)
                  setLookSaved(false)
                  setLook((current) => cycleAvatar(current, field.key, 1))
                }}
              >
                ›
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn btn-yellow w-full"
            onClick={() => {
              setLookTouched(true)
              setLookSaved(false)
              setLook(randomAvatar())
            }}
          >
            Aleatorio
          </button>
          <button type="button" className="btn btn-pink w-full" onClick={() => void saveLook()}>
            Guardar
          </button>
        </div>
        {lookSaved && <p className="text-center text-sm font-black text-pink">Avatar guardado en tus ligas.</p>}
      </section>
    </div>
  )
}
