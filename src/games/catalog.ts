import type { GameId, GameMeta } from '../types'

export const GAMES: GameMeta[] = [
  { id: 'green-tap', name: 'Toque verde', blurb: 'Toca solo cuando esté verde', category: 'Reflejo', accent: '#7cff6b', direction: 'higher', hint: 'Rojo penaliza. Verde suma.' },
  { id: 'reaction', name: 'Reacción', blurb: 'Toca en cuanto cambie el color', category: 'Reflejo', accent: '#ffd60a', direction: 'higher', hint: '5 rondas. Mejor tiempo = más puntos.' },
  { id: 'stop-bar', name: 'Para la barra', blurb: 'Detén la aguja en la zona', category: 'Timing', accent: '#3de0ff', direction: 'higher', hint: 'La zona se estrecha cada ronda.' },
  { id: 'whack', name: 'Topos', blurb: 'Golpea topos, esquiva bombas', category: 'Arcade', accent: '#ff8a3d', direction: 'higher', hint: '45 segundos. Bomba = -2.' },
  { id: 'simon', name: 'Simon', blurb: 'Repite la secuencia de colores', category: 'Memoria', accent: '#c084fc', direction: 'higher', hint: 'Un fallo y se acaba.' },
  { id: 'flappy', name: 'Aleteo', blurb: 'Un toque, un aleteo', category: 'Endless', accent: '#7cff6b', direction: 'higher', hint: 'Pasa tuberías. No toques los bordes.' },
  { id: 'snake', name: 'Serpiente', blurb: 'Come y no te muerdas', category: 'Endless', accent: '#4ade80', direction: 'higher', hint: 'Desliza para girar.' },
  { id: 'stack', name: 'Torre', blurb: 'Apila bloques cada vez más finos', category: 'Precisión', accent: '#f472b6', direction: 'higher', hint: 'Toca para soltar. Fallo = se corta.' },
  { id: 'crossy', name: 'Cruza', blurb: 'Atraviesa la calle', category: 'Arcade', accent: '#38bdf8', direction: 'higher', hint: 'Arriba para avanzar. Coches matan.' },
  { id: 'color-switch', name: 'Color switch', blurb: 'Pasa por el color correcto', category: 'Timing', accent: '#f43f5e', direction: 'higher', hint: 'Toca para cambiar de color.' },
  { id: 'knives', name: 'Cuchillos', blurb: 'Clávalos en el tronco que gira', category: 'Puntería', accent: '#fb7185', direction: 'higher', hint: 'No choques con otro cuchillo.' },
  { id: 'darts', name: 'Dardos', blurb: 'Tres dardos, misma diana', category: 'Puntería', accent: '#f97316', direction: 'higher', hint: 'Toca para fijar potencia y ángulo.' },
  { id: 'penalty', name: 'Penaltis', blurb: 'Cinco tiros, un portero', category: 'Deporte', accent: '#22c55e', direction: 'higher', hint: 'Apunta y toca. El portero usa la semilla.' },
  { id: 'piano', name: 'Piano tiles', blurb: 'Toca las negras, no las blancas', category: 'Ritmo', accent: '#e2e8f0', direction: 'higher', hint: 'Una blanca y terminas.' },
  { id: 'puzzle-2048', name: '2048', blurb: '60 segundos, misma parrilla', category: 'Puzzle', accent: '#fbbf24', direction: 'higher', hint: 'Desliza. Suma fichas iguales.' },
  { id: 'memory', name: 'Memoria', blurb: 'Parejas 4×4, mismo tablero', category: 'Memoria', accent: '#818cf8', direction: 'lower', hint: 'Menos movimientos y tiempo = mejor.' },
  { id: 'quick-maths', name: 'Cálculo rápido', blurb: 'Operaciones a saco 30s', category: 'Números', accent: '#2dd4bf', direction: 'higher', hint: 'Misma lista de cuentas para todos.' },
  { id: 'wordle', name: 'Palabra', blurb: 'Una palabra, seis intentos', category: 'Palabras', accent: '#84cc16', direction: 'higher', hint: 'Misma palabra oculta para el grupo.' },
  { id: 'water-sort', name: 'Agua de colores', blurb: 'Ordena los tubos', category: 'Puzzle', accent: '#06b6d4', direction: 'lower', hint: 'Menos movimientos gana.' },
  { id: 'lane-race', name: 'Carriles', blurb: 'Cambia de carril y aguanta', category: 'Acción', accent: '#ef4444', direction: 'higher', hint: 'Desliza izq/der. Hold no hace falta.' },
]

export const GAME_MAP: Record<GameId, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
) as Record<GameId, GameMeta>

export function nextGameId(previous: GameId | null, seed: number): GameId {
  const ids = GAMES.map((g) => g.id)
  if (!previous) return ids[seed % ids.length]!
  const idx = ids.indexOf(previous)
  return ids[(idx + 1 + (seed % (ids.length - 1))) % ids.length]!
}
