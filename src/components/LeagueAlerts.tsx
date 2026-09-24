import { useEffect, useRef, useState } from 'react'
import { findGame } from '../games/catalog'
import { aheadNotes, alertsOn, enableAlerts, iosNeedsHomeScreen, passNotes, ping } from '../lib/alerts'
import { getStore } from '../store'
import type { MyGroup } from '../store/types'

export function LeagueAlerts({ uid }: { uid: string }) {
  const [groups, setGroups] = useState<MyGroup[]>([])
  const [on, setOn] = useState(alertsOn)
  const [hint, setHint] = useState<string | null>(iosNeedsHomeScreen() ? 'En iPhone, agrega la app a la pantalla de inicio para recibir avisos.' : null)

  const sent = useRef(new Set<string>())

  useEffect(() => getStore().watchMyGroups(uid, setGroups), [uid])

  useEffect(
    () =>
      getStore().watchProfile(uid, (profile) => {
        for (const key of Object.keys(profile?.sentAlerts ?? {})) sent.current.add(key)
      }),
    [uid],
  )

  useEffect(() => {
    if (!on) return
    const claim = (key: string) => {
      const safe = key.replace(/[^a-zA-Z0-9_]/g, '_')
      if (sent.current.has(safe)) return false
      sent.current.add(safe)
      void getStore().markAlert(uid, safe)
      return true
    }
    const list = groups
    const stops = list.map((group) => {
      let chatReady = false
      const stopChat = getStore().watchMessages(group.id, (messages) => {
        if (!chatReady) {
          chatReady = true
          for (const message of messages) claim(`chat_${message.id}`)
          return
        }
        for (const message of messages) {
          if (message.uid === uid) {
            claim(`chat_${message.id}`)
            continue
          }
          if (!claim(`chat_${message.id}`)) continue
          void ping(group.name, `${message.name}: ${message.text}`, `/grupo/${group.id}`, `chat-${message.id}`)
        }
      })
      let previous: Parameters<typeof passNotes>[0] | null = null
      const stopGroup = getStore().watchGroup(group.id, (snap, live) => {
        if (!snap || !live) return
        if (!previous) {
          previous = snap
          claim(`round_${snap.round.id}`)
          for (const note of aheadNotes(snap, uid)) claim(note.key)
          return
        }
        if (previous.round.id !== snap.round.id && claim(`round_${snap.round.id}`)) {
          const game = findGame(snap.round.gameId)
          void ping(
            group.name,
            `Se avanzó a ${game?.name ?? 'otro juego'}`,
            `/grupo/${group.id}`,
            `advance-${snap.round.id}`,
            true,
          )
          for (const note of aheadNotes(snap, uid)) claim(note.key)
        }
        for (const note of passNotes(previous, snap, uid)) {
          if (!claim(note.key)) continue
          void ping(group.name, note.text, `/grupo/${group.id}`, note.key)
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
