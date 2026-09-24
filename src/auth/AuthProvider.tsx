import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getRedirectResult } from 'firebase/auth'
import { isLocalMode } from '../lib/backend'
import { blobToDataUrl, compressAvatar } from '../lib/photo'
import { getFirebase } from '../lib/firebase'
import { authErrorMessage } from '../store/firebaseStore'
import { getAuthAPI, getStore, type SessionUser } from '../store'
import type { AvatarLook, UserProfile } from '../types'

type AuthCtx = {
  session: SessionUser | null
  profile: UserProfile | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signInApple: () => Promise<void>
  signInLocal: (name: string) => Promise<void>
  signOut: () => Promise<void>
  setNickname: (name: string) => Promise<void>
  setAvatar: (look: AvatarLook) => Promise<void>
  setPhoto: (file: File | null) => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useMemo(() => getAuthAPI(), [])
  const store = useMemo(() => getStore(), [])
  const [session, setSession] = useState<SessionUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLocalMode()) {
      getRedirectResult(getFirebase().auth).catch((error) => {
        sessionStorage.setItem('jn.authError', authErrorMessage(error))
      })
    }
    return auth.subscribe((user) => {
      setSession(user)
      setLoading(false)
    })
  }, [auth])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    let unsub = () => {}
    store.ensureUser(session).then(() => {
      unsub = store.watchProfile(session.uid, setProfile)
    })
    return () => unsub()
  }, [session, store])

  const value: AuthCtx = {
    session,
    profile,
    loading,
    signInGoogle: () => auth.signInGoogle(),
    signInApple: () => auth.signInApple(),
    signInLocal: (name) => auth.signInLocal(name),
    signOut: () => auth.signOut(),
    setNickname: async (name) => {
      if (!session) return
      await store.updateNickname(session.uid, name)
    },
    setAvatar: async (look) => {
      if (!session) return
      await store.updateAvatar(session.uid, look)
    },
    setPhoto: async (file) => {
      if (!session) return
      if (!file) {
        await store.updatePhoto(session.uid, null)
        return
      }
      const blob = await compressAvatar(file)
      await store.updatePhoto(session.uid, await blobToDataUrl(blob))
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fuera de provider')
  return ctx
}
