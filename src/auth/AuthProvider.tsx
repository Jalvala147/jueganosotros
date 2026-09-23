import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getRedirectResult } from 'firebase/auth'
import { isLocalMode } from '../lib/backend'
import { getFirebase } from '../lib/firebase'
import { getAuthAPI, getStore, type SessionUser } from '../store'
import type { UserProfile } from '../types'

type AuthCtx = {
  session: SessionUser | null
  profile: UserProfile | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signInApple: () => Promise<void>
  signInLocal: (name: string) => Promise<void>
  signOut: () => Promise<void>
  setNickname: (name: string) => Promise<void>
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
      getRedirectResult(getFirebase().auth).catch(() => undefined)
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
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fuera de provider')
  return ctx
}
