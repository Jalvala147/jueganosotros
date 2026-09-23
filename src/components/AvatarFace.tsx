import {
  BGS,
  HAIR_COLORS,
  SKINS,
  type AvatarLook,
} from '../lib/avatar'

export function AvatarFace({
  look,
  size,
  ring,
}: {
  look: AvatarLook
  size: number
  ring?: string
}) {
  const skin = SKINS[look.skin % SKINS.length]!
  const hair = HAIR_COLORS[look.hairColor % HAIR_COLORS.length]!
  const bg = BGS[look.bg % BGS.length]!
  const style = look.hair % 6
  const eyes = look.eyes % 4
  const mouth = look.mouth % 4
  const extra = look.accessory % 5
  const cap = extra === 2

  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className="shrink-0 rounded-full"
      style={ring && ring !== 'transparent' ? { boxShadow: `0 0 0 3px ${ring}` } : undefined}
      aria-hidden
    >
      <circle cx="40" cy="40" r="40" fill={bg} />
      <circle cx="18" cy="48" r="6" fill={skin} />
      <circle cx="62" cy="48" r="6" fill={skin} />
      {style === 2 && <path d="M18 40c0-16 10-24 22-24s22 8 22 24v16H18V40z" fill={hair} />}
      {style === 5 && (
        <>
          <circle cx="24" cy="34" r="8" fill={hair} />
          <circle cx="40" cy="26" r="9" fill={hair} />
          <circle cx="56" cy="34" r="8" fill={hair} />
        </>
      )}
      <circle cx="40" cy="48" r="22" fill={skin} />
      {style === 1 && <ellipse cx="40" cy="30" rx="20" ry="12" fill={hair} />}
      {style === 2 && <path d="M20 36c2-14 10-20 20-20s18 6 20 20c-6-6-12-8-20-8s-14 2-20 8z" fill={hair} />}
      {style === 3 && (
        <path d="M22 36 L28 16 L34 34 L40 12 L46 34 L52 16 L58 36 Z" fill={hair} />
      )}
      {style === 4 && (
        <>
          <ellipse cx="40" cy="32" rx="18" ry="10" fill={hair} />
          <circle cx="40" cy="18" r="8" fill={hair} />
        </>
      )}
      {style === 5 && (
        <>
          <circle cx="28" cy="32" r="6" fill={hair} />
          <circle cx="40" cy="28" r="7" fill={hair} />
          <circle cx="52" cy="32" r="6" fill={hair} />
        </>
      )}
      <Eyes kind={eyes} />
      <Mouth kind={mouth} />
      <circle cx="30" cy="54" r="2.2" fill="#ff8aa3" opacity="0.85" />
      <circle cx="50" cy="54" r="2.2" fill="#ff8aa3" opacity="0.85" />
      {extra === 1 && (
        <g fill="none" stroke="#1c1430" strokeWidth="2.4">
          <circle cx="32" cy="46" r="6" />
          <circle cx="48" cy="46" r="6" />
          <path d="M38 46h4" />
        </g>
      )}
      {cap && (
        <>
          <path d="M20 34c2-14 10-18 20-18s18 4 20 18c-8-5-14-7-20-7s-12 2-20 7z" fill={hair} />
          <path d="M16 34h40c2 5 0 8-4 8H22c-6 0-8-3-6-8z" fill="#1c1430" />
        </>
      )}
      {extra === 3 && (
        <g fill="#ff4571">
          <circle cx="58" cy="28" r="5" />
          <path d="M54 24l8-6 2 6-6 2z" />
          <path d="M54 32l8 6 2-6-6-2z" />
        </g>
      )}
      {extra === 4 && <polygon points="58,22 60,28 66,28 61,32 63,38 58,34 53,38 55,32 50,28 56,28" fill="#ffd145" />}
    </svg>
  )
}

function Eyes({ kind }: { kind: number }) {
  if (kind === 1) {
    return (
      <path
        d="M26 46c3-4 8-4 11 0M43 46c3-4 8-4 11 0"
        fill="none"
        stroke="#1c1430"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    )
  }
  if (kind === 2) {
    return (
      <g>
        <circle cx="32" cy="46" r="2.4" fill="#1c1430" />
        <path d="M43 46c3-4 8-4 11 0" fill="none" stroke="#1c1430" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    )
  }
  if (kind === 3) {
    return (
      <g fill="#ffd145" stroke="#1c1430" strokeWidth="1.2">
        <polygon points="32,40 34,45 39,45 35,48 36,53 32,50 28,53 29,48 25,45 30,45" />
        <polygon points="48,40 50,45 55,45 51,48 52,53 48,50 44,53 45,48 41,45 46,45" />
      </g>
    )
  }
  return (
    <g fill="#1c1430">
      <circle cx="32" cy="46" r="2.6" />
      <circle cx="48" cy="46" r="2.6" />
    </g>
  )
}

function Mouth({ kind }: { kind: number }) {
  if (kind === 1) {
    return (
      <g>
        <path d="M30 58c3 8 17 8 20 0" fill="#fff" stroke="#1c1430" strokeWidth="2" />
        <path d="M32 58h16" stroke="#1c1430" strokeWidth="1.4" />
      </g>
    )
  }
  if (kind === 2) {
    return <ellipse cx="40" cy="60" rx="6" ry="5" fill="#1c1430" />
  }
  if (kind === 3) {
    return <path d="M30 60h20" stroke="#1c1430" strokeWidth="2.4" strokeLinecap="round" />
  }
  return (
    <path d="M30 57c4 7 16 7 20 0" fill="none" stroke="#1c1430" strokeWidth="2.4" strokeLinecap="round" />
  )
}
