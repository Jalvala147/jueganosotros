import { findGame } from '../games/catalog'
import type { GroupSnapshot } from '../types'

const KEY = 'jn.alerts'

export function alertsOn(): boolean {
  return localStorage.getItem(KEY) === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

export function iosNeedsHomeScreen(): boolean {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  return ios && !standalone
}

export async function enableAlerts(): Promise<void> {
  if (typeof Notification === 'undefined') {
    throw new Error('Este navegador no muestra avisos.')
  }
  if (iosNeedsHomeScreen()) {
    throw new Error('En iPhone, agrega JuegaNosotros a la pantalla de inicio y ábrelo desde ahí.')
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('No se activaron los avisos.')
  localStorage.setItem(KEY, '1')
}

export async function ping(title: string, body: string, url: string, tag: string, always = false) {
  if (!alertsOn()) return
  if (!always && !document.hidden && window.location.pathname.startsWith(url)) return
  const options: NotificationOptions = {
    body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    lang: 'es-MX',
    tag,
    data: { url },
  }
  const reg = await navigator.serviceWorker?.ready
  if (reg) await reg.showNotification(title, options)
  else new Notification(title, options)
}

function ahead(direction: 'higher' | 'lower' | undefined, score: number, mine: number) {
  return direction === 'lower' ? score < mine : score > mine
}

export function passNotes(prev: GroupSnapshot, next: GroupSnapshot, uid: string): string[] {
  if (prev.round.id !== next.round.id) return []
  const mine = next.plays[uid]?.best ?? prev.plays[uid]?.best
  const game = findGame(next.round.gameId)
  const notes: string[] = []
  if (mine != null) {
    for (const member of next.members) {
      if (member.uid === uid) continue
      const after = next.plays[member.uid]?.best
      if (after == null) continue
      const before = prev.plays[member.uid]?.best
      const wasAhead = before != null && ahead(game?.direction, before, mine)
      const nowAhead = ahead(game?.direction, after, mine)
      if (!wasAhead && nowAhead) notes.push(`${member.displayName} te superó en ${game?.name ?? 'la ronda'}`)
    }
  }
  const myPoints = next.members.find((m) => m.uid === uid)?.seasonPoints
  const prevPoints = prev.members.find((m) => m.uid === uid)?.seasonPoints ?? myPoints
  if (myPoints == null || prevPoints == null) return notes
  for (const member of next.members) {
    if (member.uid === uid) continue
    const before = prev.members.find((m) => m.uid === member.uid)?.seasonPoints ?? 0
    if (before <= prevPoints && member.seasonPoints > myPoints) {
      notes.push(`${member.displayName} te pasó en la temporada`)
    }
  }
  return notes
}
