import { useEffect, useState } from 'react'
import { findGame } from '../games/catalog'
import { alertsOn, enableAlerts, iosNeedsHomeScreen, passNotes, ping } from '../lib/alerts'
import { getStore } from '../store'
import type { MyGroup } from '../store/types'

export function LeagueAlerts({ uid }: { uid: string }) {
  const [groups, setGroups] = useState<MyGroup[]>([])
  const [on, setOn] = useState(alertsOn)
  const [hint, setHint] = useState<string | null>(iosNeedsHomeScreen() ? 'En iPhone, agrega la app a la pantalla de inicio para recibir avisos.' : null)

  useEffect(() => getStore().watchMyGroups(uid, setGroups), [uid])

  useEffect(() => {
    if (!on) return
    const list = groups
    const stops = list.map((group) => {
      const seen = new Set<string>()
      let primedChat = false
      const stopChat = getStore().watchMessages(group.id, (messages) => {
        if (!primedChat) {
          for (const message of messages) seen.add(message.id)
          primedChat = true
          return
        }
        for (const message of messages) {
          if (seen.has(message.id)) continue
          seen.add(message.id)
          if (message.uid === uid) continue
          void ping(group.name, `${message.name}: ${message.text}`, `/grupo/${group.id}`, `chat-${group.id}`)
        }
      })
      let primed = false
      let previous: Parameters<typeof passNotes>[0] | null = null
      const stopGroup = getStore().watchGroup(group.id, (snap) => {
        if (!snap) return
        if (!primed || !previous) {
          primed = true
          previous = snap
          return
        }
        if (previous.round.id !== snap.round.id) {
          const game = findGame(snap.round.gameId)
          void ping(
            group.name,
            `Se avanzó a ${game?.name ?? 'otro juego'}`,
            `/grupo/${group.id}`,
            `advance-${snap.round.id}`,
            true,
          )
        }
        for (const note of passNotes(previous, snap, uid)) {
          void ping(group.name, note, `/grupo/${group.id}`, `pass-${group.id}`)
        }
        previous = snap
      })
      return () => {
        stopChat()
        stopGroup()
      }
    })
    return () => stops.forEach((stop) => stop())
  }, [groups, on, uid])

  if (on) return null

  return (
    <button
      type="button"
      className="btn btn-yellow mb-4 w-full"
      onClick={() => {
        void enableAlerts()
          .then(() => {
            setOn(true)
            setHint(null)
          })
          .catch((e: unknown) => setHint(e instanceof Error ? e.message : 'No se activaron'))
      }}
    >
      Activar avisos
      {hint && <span className="mt-1 block text-center text-xs font-extrabold leading-snug">{hint}</span>}
    </button>
  )
}
