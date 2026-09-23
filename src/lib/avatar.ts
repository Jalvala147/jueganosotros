export type AvatarLook = {
  skin: number
  hair: number
  hairColor: number
  eyes: number
  mouth: number
  accessory: number
  bg: number
}

export const SKINS = ['#F8D3B0', '#E8B48A', '#C68642', '#8D5524', '#5A3820', '#F4C2C2']
export const HAIR_COLORS = ['#1C1430', '#6B4F3A', '#E23B5A', '#F0C14A', '#5B3CC4', '#1AA8A3', '#F3F0EA']
export const BGS = ['#FF4571', '#FFD145', '#8260F6', '#28DAD4', '#4C4660', '#FF8A3D']

export const HAIR_LABELS = ['Rapado', 'Corto', 'Melena', 'Pinchos', 'Moño', 'Rizos']
export const EYE_LABELS = ['Puntos', 'Alegres', 'Guiño', 'Estrellas']
export const MOUTH_LABELS = ['Sonrisa', 'Risa', 'Sorpresa', 'Serio']
export const EXTRA_LABELS = ['Nada', 'Gafas', 'Gorra', 'Lazo', 'Estrella']

export const AVATAR_PARTS = {
  skin: SKINS.length,
  hair: HAIR_LABELS.length,
  hairColor: HAIR_COLORS.length,
  eyes: EYE_LABELS.length,
  mouth: MOUTH_LABELS.length,
  accessory: EXTRA_LABELS.length,
  bg: BGS.length,
} as const

export function hashName(name: string): number {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function defaultAvatar(seed: number): AvatarLook {
  const n = seed >>> 0
  return {
    skin: n % SKINS.length,
    hair: (n >>> 3) % HAIR_LABELS.length,
    hairColor: (n >>> 6) % HAIR_COLORS.length,
    eyes: (n >>> 9) % EYE_LABELS.length,
    mouth: (n >>> 12) % MOUTH_LABELS.length,
    accessory: (n >>> 15) % EXTRA_LABELS.length,
    bg: (n >>> 18) % BGS.length,
  }
}

export function randomAvatar(): AvatarLook {
  const pick = (n: number) => Math.floor(Math.random() * n)
  return {
    skin: pick(SKINS.length),
    hair: pick(HAIR_LABELS.length),
    hairColor: pick(HAIR_COLORS.length),
    eyes: pick(EYE_LABELS.length),
    mouth: pick(MOUTH_LABELS.length),
    accessory: pick(EXTRA_LABELS.length),
    bg: pick(BGS.length),
  }
}

export function cycleAvatar(look: AvatarLook, key: keyof AvatarLook, dir: 1 | -1): AvatarLook {
  const max = AVATAR_PARTS[key]
  return { ...look, [key]: (look[key] + dir + max) % max }
}
