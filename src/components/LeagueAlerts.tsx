import { useEffect, useState } from 'react'
import { findGame } from '../games/catalog'
import { aheadNotes, alertsOn, enableAlerts, iosNeedsHomeScreen, passNotes, ping } from '../lib/alerts'
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
      const chatKey = `jn.alert.chat.${group.id}`
      const stopChat = getStore().watchMessages(group.id, (messages) => {
        const cursor = localStorage.getItem(chatKey)
        if (!cursor) {
          const last = messages.at(-1)
          if (last) localStorage.setItem(chatKey, last.id)
          return
        }
        const start = messages.findIndex((message) => message.id === cursor)
        const fresh = start === -1 ? [] : messages.slice(start + 1)
        for (const message of fresh) {
          if (message.uid !== uid) {
            void ping(group.name, `${message.name}: ${message.text}`, `/grupo/${group.id}`, `chat-${message.id}`)
          }
          localStorage.setItem(chatKey, message.id)
        }
      })
      let previous: Parameters<typeof passNotes>[0] | null = null
      const stopGroup = getStore().watchGroup(group.id, (snap, live) => {
        if (!snap || !live) return
        const roundKey = `jn.alert.round.${group.id}`
        const passKey = `jn.alert.pass.${group.id}.${snap.round.id}`
        const told = new Set((localStorage.getItem(passKey) ?? '').split('|').filter(Boolean))
        if (!previous) {
          previous = snap
          localStorage.setItem(roundKey, snap.round.id)
          for (const note of aheadNotes(snap, uid)) told.add(note)
          localStorage.setItem(passKey, [...told].join('|'))
          return
        }
        if (previous.round.id !== snap.round.id && localStorage.getItem(roundKey) !== snap.round.id) {
          const game = findGame(snap.round.gameId)
          localStorage.setItem(roundKey, snap.round.id)
          void ping(
            group.name,
            `Se avanzó a ${game?.name ?? 'otro juego'}`,
            `/grupo/${group.id}`,
            `advance-${snap.round.id}`,
            true,
          )
        }
        for (const note of passNotes(previous, snap, uid)) {
          if (told.has(note)) continue
          told.add(note)
          void ping(group.name, note, `/grupo/${group.id}`, `pass-${group.id}`)
        }
        localStorage.setItem(passKey, [...told].join('|'))
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
