import type { ReactNode } from 'react'
import { GAME_MAP } from '../games/catalog'
import type { GameId } from '../types'

const INK = '#1c1430'
const WHITE = '#fff'
const PINK = '#ff4571'
const YELLOW = '#ffd145'
const PURPLE = '#8260f6'
const CYAN = '#28dad4'

const BACK: Record<string, [string, string]> = {
  Reflejo: ['#7cf0ea', '#ffe58a'],
  Timing: ['#c7b6ff', '#7cf0ea'],
  Arcade: ['#ff8eab', '#ffe58a'],
  Memoria: ['#c7b6ff', '#ff8eab'],
  Endless: ['#7cf0ea', '#c7b6ff'],
  Precisión: ['#ffe58a', '#ff8eab'],
  Puntería: ['#ff8eab', '#c7b6ff'],
  Deporte: ['#7cf0ea', '#ffe58a'],
  Ritmo: ['#6d6584', '#c7b6ff'],
  Puzzle: ['#ffe58a', '#7cf0ea'],
  Números: ['#7cf0ea', '#ff8eab'],
  Palabras: ['#ffe58a', '#c7b6ff'],
  Acción: ['#ff8eab', '#ffe58a'],
}

export function GamePreview({ id, className = 'h-32' }: { id: GameId; className?: string }) {
  const game = GAME_MAP[id]
  const [from, to] = BACK[game.category] ?? ['#ff8eab', '#ffe58a']
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
    >
      <span className="pointer-events-none absolute -right-4 -top-6 h-16 w-16 rounded-full bg-white/35" />
      <svg viewBox="0 0 160 110" className="relative h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        {scene(id)}
      </svg>
    </div>
  )
}

function scene(id: GameId): ReactNode {
  switch (id) {
    case 'green-tap':
      return (
        <>
          <circle cx="80" cy="58" r="34" fill="#22c55e" stroke={INK} strokeWidth="4" />
          <circle cx="80" cy="58" r="16" fill={WHITE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'reaction':
      return (
        <>
          <circle cx="42" cy="58" r="16" fill="#d9d3ea" stroke={INK} strokeWidth="4" />
          <circle cx="80" cy="54" r="22" fill={YELLOW} stroke={INK} strokeWidth="4" />
          <circle cx="118" cy="58" r="16" fill="#d9d3ea" stroke={INK} strokeWidth="4" />
          <path d="M80 28l4 10h-8z" fill={PINK} />
        </>
      )
    case 'stop-bar':
      return (
        <>
          <path d="M30 78 A50 50 0 0 1 130 78" fill="none" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path d="M58 78 A22 22 0 0 1 102 78" fill="none" stroke={YELLOW} strokeWidth="10" strokeLinecap="round" />
          <path d="M80 78 L108 48" stroke={PINK} strokeWidth="5" strokeLinecap="round" />
          <circle cx="80" cy="78" r="7" fill={WHITE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'whack':
      return (
        <>
          <ellipse cx="48" cy="78" rx="22" ry="8" fill={INK} />
          <ellipse cx="112" cy="78" rx="22" ry="8" fill={INK} />
          <ellipse cx="80" cy="48" rx="22" ry="8" fill={INK} />
          <circle cx="80" cy="40" r="14" fill="#c68642" stroke={INK} strokeWidth="3" />
          <circle cx="74" cy="38" r="2" fill={INK} />
          <circle cx="86" cy="38" r="2" fill={INK} />
        </>
      )
    case 'simon':
      return (
        <>
          <path d="M80 22 A36 36 0 0 1 116 58 L80 58 Z" fill={PINK} stroke={INK} strokeWidth="3" />
          <path d="M116 58 A36 36 0 0 1 80 94 L80 58 Z" fill={YELLOW} stroke={INK} strokeWidth="3" />
          <path d="M80 94 A36 36 0 0 1 44 58 L80 58 Z" fill={CYAN} stroke={INK} strokeWidth="3" />
          <path d="M44 58 A36 36 0 0 1 80 22 L80 58 Z" fill={PURPLE} stroke={INK} strokeWidth="3" />
          <circle cx="80" cy="58" r="10" fill={WHITE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'flappy':
      return (
        <>
          <rect x="18" y="18" width="16" height="28" rx="4" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="18" y="68" width="16" height="28" rx="4" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="118" y="14" width="16" height="22" rx="4" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="118" y="58" width="16" height="38" rx="4" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <ellipse cx="72" cy="52" rx="16" ry="12" fill={YELLOW} stroke={INK} strokeWidth="3" />
          <polygon points="86,52 98,46 98,58" fill={PINK} stroke={INK} strokeWidth="3" />
          <circle cx="78" cy="48" r="2" fill={INK} />
        </>
      )
    case 'snake':
      return (
        <>
          <rect x="28" y="28" width="18" height="18" rx="5" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="48" y="28" width="18" height="18" rx="5" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="68" y="28" width="18" height="18" rx="5" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="68" y="48" width="18" height="18" rx="5" fill="#3d9a4a" stroke={INK} strokeWidth="3" />
          <rect x="68" y="68" width="18" height="18" rx="5" fill={YELLOW} stroke={INK} strokeWidth="3" />
          <circle cx="112" cy="40" r="8" fill={PINK} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'stack':
      return (
        <>
          <rect x="46" y="74" width="68" height="16" rx="4" fill={PURPLE} stroke={INK} strokeWidth="3" />
          <rect x="54" y="56" width="52" height="16" rx="4" fill={PINK} stroke={INK} strokeWidth="3" />
          <rect x="40" y="38" width="60" height="16" rx="4" fill={YELLOW} stroke={INK} strokeWidth="3" />
          <rect x="70" y="20" width="48" height="16" rx="4" fill={CYAN} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'crossy':
      return (
        <>
          <rect x="16" y="24" width="128" height="18" rx="4" fill="#3d4a63" />
          <rect x="16" y="50" width="128" height="18" rx="4" fill="#3d4a63" />
          <rect x="16" y="76" width="128" height="18" rx="4" fill="#3d4a63" />
          <rect x="30" y="26" width="28" height="14" rx="3" fill={PINK} stroke={INK} strokeWidth="2" />
          <rect x="90" y="52" width="28" height="14" rx="3" fill={YELLOW} stroke={INK} strokeWidth="2" />
          <circle cx="80" cy="86" r="9" fill={WHITE} stroke={INK} strokeWidth="3" />
          <polygon points="80,74 88,84 72,84" fill={YELLOW} stroke={INK} strokeWidth="2" />
        </>
      )
    case 'color-switch':
      return (
        <>
          <rect x="28" y="24" width="104" height="18" rx="9" fill={PINK} stroke={INK} strokeWidth="3" />
          <rect x="70" y="24" width="22" height="18" fill={CYAN} />
          <circle cx="80" cy="78" r="16" fill={CYAN} stroke={INK} strokeWidth="4" />
        </>
      )
    case 'knives':
      return (
        <>
          <circle cx="80" cy="58" r="26" fill="#c68642" stroke={INK} strokeWidth="4" />
          <circle cx="80" cy="58" r="8" fill="#8d5524" />
          <rect x="104" y="52" width="36" height="8" rx="3" fill="#d9d3ea" stroke={INK} strokeWidth="3" />
          <rect x="20" y="34" width="28" height="7" rx="3" fill="#d9d3ea" stroke={INK} strokeWidth="3" transform="rotate(-30 34 37)" />
          <rect x="24" y="78" width="28" height="7" rx="3" fill="#d9d3ea" stroke={INK} strokeWidth="3" transform="rotate(24 38 81)" />
        </>
      )
    case 'darts':
      return (
        <>
          <circle cx="80" cy="56" r="34" fill={PINK} stroke={INK} strokeWidth="3" />
          <circle cx="80" cy="56" r="22" fill={WHITE} stroke={INK} strokeWidth="3" />
          <circle cx="80" cy="56" r="12" fill={YELLOW} stroke={INK} strokeWidth="3" />
          <circle cx="80" cy="56" r="4" fill={INK} />
        </>
      )
    case 'penalty':
      return (
        <>
          <path d="M36 86 V34 h88 v52" fill="none" stroke={WHITE} strokeWidth="5" />
          <circle cx="108" cy="62" r="12" fill={PURPLE} stroke={INK} strokeWidth="3" />
          <circle cx="58" cy="78" r="10" fill={WHITE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'piano':
      return (
        <>
          <rect x="28" y="22" width="26" height="68" rx="4" fill={WHITE} stroke={INK} strokeWidth="3" />
          <rect x="56" y="22" width="26" height="68" rx="4" fill={INK} stroke={INK} strokeWidth="3" />
          <rect x="84" y="22" width="26" height="68" rx="4" fill={WHITE} stroke={INK} strokeWidth="3" />
          <rect x="112" y="22" width="26" height="68" rx="4" fill={WHITE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'puzzle-2048':
      return (
        <>
          <rect x="36" y="24" width="28" height="28" rx="6" fill={WHITE} stroke={INK} strokeWidth="3" />
          <rect x="68" y="24" width="28" height="28" rx="6" fill={YELLOW} stroke={INK} strokeWidth="3" />
          <rect x="100" y="24" width="28" height="28" rx="6" fill="#efe6ff" stroke={INK} strokeWidth="3" />
          <rect x="36" y="56" width="28" height="28" rx="6" fill="#efe6ff" stroke={INK} strokeWidth="3" />
          <rect x="68" y="56" width="28" height="28" rx="6" fill={PINK} stroke={INK} strokeWidth="3" />
          <rect x="100" y="56" width="28" height="28" rx="6" fill={WHITE} stroke={INK} strokeWidth="3" />
          <text x="44" y="44" fontSize="14" fontWeight="700" fill={INK}>2</text>
          <text x="76" y="44" fontSize="14" fontWeight="700" fill={INK}>4</text>
          <text x="74" y="76" fontSize="12" fontWeight="700" fill={WHITE}>8</text>
        </>
      )
    case 'memory':
      return (
        <>
          <rect x="34" y="28" width="28" height="36" rx="6" fill={PURPLE} stroke={INK} strokeWidth="3" />
          <rect x="66" y="28" width="28" height="36" rx="6" fill={WHITE} stroke={INK} strokeWidth="3" />
          <circle cx="80" cy="46" r="8" fill={PINK} />
          <rect x="98" y="28" width="28" height="36" rx="6" fill={PURPLE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'quick-maths':
      return (
        <text x="28" y="72" fontSize="36" fontWeight="700" fill={INK}>
          3+4
        </text>
      )
    case 'wordle':
      return (
        <>
          {['J', 'U', 'E', 'G', 'O'].map((ch, i) => (
            <g key={ch}>
              <rect x={22 + i * 24} y="40" width="20" height="20" rx="4" fill={i === 0 ? YELLOW : i === 2 ? PINK : WHITE} stroke={INK} strokeWidth="3" />
              <text x={27 + i * 24} y="55" fontSize="12" fontWeight="700" fill={i === 2 ? WHITE : INK}>
                {ch}
              </text>
            </g>
          ))}
        </>
      )
    case 'water-sort':
      return (
        <>
          <rect x="36" y="24" width="22" height="64" rx="10" fill={WHITE} stroke={INK} strokeWidth="3" />
          <rect x="40" y="52" width="14" height="16" fill={PINK} />
          <rect x="40" y="68" width="14" height="14" fill={CYAN} />
          <rect x="70" y="24" width="22" height="64" rx="10" fill={WHITE} stroke={INK} strokeWidth="3" />
          <rect x="74" y="44" width="14" height="16" fill={YELLOW} />
          <rect x="74" y="60" width="14" height="22" fill={PURPLE} />
          <rect x="104" y="24" width="22" height="64" rx="10" fill={WHITE} stroke={INK} strokeWidth="3" />
        </>
      )
    case 'lane-race':
      return (
        <>
          <rect x="36" y="16" width="28" height="80" rx="8" fill="#efe6ff" stroke={INK} strokeWidth="3" />
          <rect x="66" y="16" width="28" height="80" rx="8" fill={WHITE} stroke={INK} strokeWidth="3" />
          <rect x="96" y="16" width="28" height="80" rx="8" fill="#efe6ff" stroke={INK} strokeWidth="3" />
          <rect x="72" y="62" width="16" height="24" rx="4" fill={PINK} stroke={INK} strokeWidth="3" />
          <rect x="40" y="28" width="16" height="20" rx="4" fill={YELLOW} stroke={INK} strokeWidth="3" />
        </>
      )
    default:
      return null
  }
}
