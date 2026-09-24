import { useEffect, useRef, useState } from 'react'
import { getStore } from '../store'
import type { ChatMessage } from '../types'

export function GroupChat({
  groupId,
  uid,
  name,
}: {
  groupId: string
  uid: string
  name: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const end = useRef<HTMLDivElement | null>(null)

  useEffect(() => getStore().watchMessages(groupId, setMessages), [groupId])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send() {
    setError(null)
    try {
      await getStore().sendMessage(groupId, uid, name, text)
      setText('')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se envió'
      setError(
        message.toLowerCase().includes('permission')
          ? 'Firestore bloqueó el mensaje. Publica las reglas del proyecto y vuelve a intentar.'
          : message,
      )
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b-[3px] border-ink px-4 py-3">
        <h2 className="display text-2xl font-bold leading-none">Chat de la liga</h2>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="px-2 py-6 text-center text-sm font-extrabold leading-relaxed text-ink/55">
            Todavía no hay mensajes. Escribe el primero.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.uid === uid
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl border-[3px] border-ink px-3 py-2 ${
                  mine ? 'bg-pink text-white' : 'bg-white text-ink'
                }`}
              >
                <p className={`text-xs font-black ${mine ? 'text-white/80' : 'text-ink/55'}`}>
                  {message.name || 'Jugador'}
                  {mine ? ' · tú' : ''}
                </p>
                <p className="text-base font-extrabold leading-snug break-words">{message.text}</p>
              </div>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t-[3px] border-ink p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          className="input min-w-0 flex-1"
          value={text}
          maxLength={240}
          placeholder="Mensaje para la liga"
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn btn-pink shrink-0 px-4" disabled={!text.trim()}>
          Enviar
        </button>
      </form>
      {error && <p className="px-3 pb-3 text-sm font-black text-pink">{error}</p>}
    </section>
  )
}
