export function isLocalMode(): boolean {
  return (
    import.meta.env.VITE_USE_LOCAL === 'true' ||
    !import.meta.env.VITE_FIREBASE_API_KEY
  )
}
