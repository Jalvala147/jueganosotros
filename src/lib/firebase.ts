import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { isLocalMode } from './backend'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function firebaseReady(): boolean {
  return !isLocalMode()
}

export function getFirebase() {
  if (isLocalMode()) {
    throw new Error('Firebase no está configurado. Rellena .env.local')
  }
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })
    auth = getAuth(app)
    db = getFirestore(app)
  }
  return { app, auth: auth!, db: db! }
}
