export function makeId(prefix = ''): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return prefix ? `${prefix}_${hex}` : hex
}
