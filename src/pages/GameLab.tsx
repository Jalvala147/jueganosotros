// TEMP: página para probar minijuegos sueltos. Quitar cuando ya no haga falta.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GamePreview } from '../components/GamePreview'
import { GameHost } from '../games/Host'
import { GAMES } from '../games/catalog'
import type { GameId } from '../types'

export function GameLab() {
  const [id, setId] = useState<GameId | null>(null)
  const [seed, setSeed] = useState(1)
  const [score, setScore] = useState<number | null>(null)
  const game = GAMES.find((item) => item.id === id)

  function open(next: GameId) {
    setId(next)
    setSeed(Date.now() >>> 0)
    setScore(null)
  }

  if (game && score == null) {
    return (
      <div className="space-y-3">
        <button className="text-sm font-black text-ink/60" onClick={() => setId(null)}>
          ← Todos los juegos
        </button>
        <p className="display text-2xl font-bold leading-none">{game.name}</p>
        <GameHost key={`${game.id}:${seed}`} id={game.id} seed={seed} onFinish={setScore} />
      </div>
    )
  }

  if (game && score != null) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-ink/45">{game.name}</p>
        <p className="display text-7xl font-bold leading-none text-pink">{score}</p>
        <p className="text-sm font-bold text-ink/55">No se guarda. Es solo para probar.</p>
        <button className="btn btn-pink w-full" onClick={() => open(game.id)}>
          Otra vez
        </button>
        <button className="btn btn-ghost w-full" onClick={() => setId(null)}>
          Elegir otro
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Link to="/" className="text-sm font-black text-ink/60 no-underline">
          ← Inicio
        </Link>
        <h1 className="display mt-2 text-4xl font-bold leading-none">Probar juegos</h1>
        <p className="mt-2 text-sm font-bold text-ink/60">
          Apartado temporal. El puntaje no entra en la vitrina ni en la liga.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((item) => (
          <button key={item.id} type="button" className="card overflow-hidden text-left" onClick={() => open(item.id)}>
            <div className="relative">
              <GamePreview id={item.id} className="h-28" />
              <p className="absolute bottom-2 left-2 max-w-[90%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-ink">
                {item.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
