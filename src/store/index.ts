import { isLocalMode } from '../lib/backend'
import { firebaseAuth, firebaseStore } from './firebaseStore'
import { localAuth, localStore } from './local'
import type { AuthAPI, StoreAPI } from './types'

export function getAuthAPI(): AuthAPI {
  return isLocalMode() ? localAuth : firebaseAuth
}

export function getStore(): StoreAPI {
  return isLocalMode() ? localStore : firebaseStore
}

export { isLocalMode }
export type { SessionUser } from './types'
