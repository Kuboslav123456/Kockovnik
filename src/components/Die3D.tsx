import { animate, motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { useEffect, useRef, type CSSProperties } from 'react'
import type { DieDef } from '../lib/dice'

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
}

/** natočenie (rotateX, rotateY), pri ktorom je daná stena vpredu */
const FRONT: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] }

type Props = {
  die: DieDef
  size?: number
  idle?: boolean
  interactive?: boolean
  speed?: number
  /** rýchle točenie počas hodu */
  rolling?: boolean
  /** po hode dopadne touto stenou dopredu */
  show?: number | null
}

/**
 * 3D kocka z Klenotnice. `idle` = pomaly sa točí, `interactive` = dá sa otáčať prstom.
 * Ostatné kocky stoja v pootočenej polohe, aby boli vidieť tri steny.
 *
 * Výkon: stojaca a pomaly sa točiaca kocka nepoužívajú JavaScript na každý snímok –
 * točenie robí CSS animácia priamo na grafickom čipe, takže nesekne ani pri prekresľovaní appky.
 */
export function Die3D(props: Props) {
  const { rolling = false, show = null, interactive = false } = props
  if (rolling || show != null || interactive) return <AnimatedDie {...props} />
  return <CssDie {...props} />
}

/** Stojaca kocka alebo pomalé točenie cez CSS (bez JavaScriptu počas animácie) */
function CssDie({ die, size = 64, idle = false, speed = 1 }: Props) {
  if (!idle) {
    return (
      <Shell die={die} size={size}>
        {/* stojaca kocka: pri tomto natočení sú vidieť len steny 1, 3 a 5 – ostatné netreba kresliť */}
        <Cube die={die} size={size} only={STATIC_FACES} style={{ transform: 'rotateX(-24deg) rotateY(36deg)' }} />
      </Shell>
    )
  }
  // vonkajší prvok sa pomaly kníše okolo osi X, vnútorný sa točí okolo Y
  return (
    <Shell die={die} size={size}>
      <div className="die-spin-x" style={{ width: size, height: size, transformStyle: 'preserve-3d', animationDuration: `${30 / speed}s` }}>
        <Cube die={die} size={size} className="die-spin-y" style={{ animationDuration: `${10.3 / speed}s` }} />
      </div>
    </Shell>
  )
}

/** Hod, dopad na číslo a otáčanie prstom – tu je JavaScript potrebný */
function AnimatedDie({ die, size = 64, idle = false, interactive = false, speed = 1, rolling = false, show = null }: Props) {
  const rx = useMotionValue(-24)
  const ry = useMotionValue(36)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useAnimationFrame((_, dt) => {
    if (drag.current) return
    if (rolling) {
      ry.set(ry.get() + dt * 0.9)
      rx.set(rx.get() + dt * 0.65)
      return
    }
    if (!idle || show != null) return
    ry.set(ry.get() + dt * 0.035 * speed)
    rx.set(rx.get() + dt * 0.012 * speed)
  })

  // dopad: dotočí sa (aspoň o jednu otáčku) tak, aby hodené číslo bolo vpredu, s jemným náklonom
  useEffect(() => {
    if (show == null || rolling) return
    const [bx, by] = FRONT[show]
    const tx = bx - 14 + 360 * Math.round(rx.get() / 360)
    const ty = by + 16 + 360 * (Math.round(ry.get() / 360) + 1)
    const a = animate(rx, tx, { type: 'spring', stiffness: 120, damping: 14 })
    const b = animate(ry, ty, { type: 'spring', stiffness: 120, damping: 14 })
    return () => {
      a.stop()
      b.stop()
    }
  }, [show, rolling]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Shell
      die={die}
      size={size}
      interactive={interactive}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY }
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        ry.set(ry.get() + (e.clientX - drag.current.x) * 0.6)
        rx.set(rx.get() - (e.clientY - drag.current.y) * 0.6)
        drag.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <motion.div style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d', rotateX: rx, rotateY: ry }}>
        <Faces die={die} size={size} />
      </motion.div>
    </Shell>
  )
}

/**
 * Obal s perspektívou. Žiara vzácnych kociek je obyčajný rozmazaný kruh za kockou –
 * `filter: drop-shadow` na točiacej sa kocke by mobil prepočítaval pri každom snímku.
 */
function Shell({
  die,
  size,
  interactive,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  die: DieDef
  size: number
  interactive?: boolean
  children: React.ReactNode
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerMove?: (e: React.PointerEvent) => void
  onPointerUp?: () => void
  onPointerCancel?: () => void
}) {
  return (
    <div
      style={{ width: size, height: size, perspective: size * 7, position: 'relative', touchAction: interactive ? 'none' : undefined }}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerCancel : undefined}
    >
      {die.glow && (
        <div
          className="pointer-events-none absolute rounded-full"
          style={{ inset: -size * 0.3, background: `radial-gradient(circle, ${die.glow} 0%, transparent 65%)` }}
        />
      )}
      {children}
      {/* iskrenie z kovárne – len blikanie priehľadnosti, nič sa neprepočítava */}
      {die.sparkle &&
        SPARKS.map((s, i) => (
          <span
            key={i}
            className="pointer-events-none absolute leading-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              fontSize: Math.max(7, size * s.s),
              color: '#fff3c4',
              textShadow: '0 0 6px #ffbf3f',
              animation: `twinkle ${s.d}s ease-in-out ${s.delay}s infinite`,
            }}
          >
            ✦
          </span>
        ))}
    </div>
  )
}

const SPARKS = [
  { x: -18, y: -12, s: 0.22, d: 1.6, delay: 0 },
  { x: 98, y: 6, s: 0.16, d: 1.9, delay: 0.5 },
  { x: 86, y: 92, s: 0.2, d: 1.4, delay: 0.9 },
  { x: -10, y: 80, s: 0.14, d: 2.1, delay: 0.3 },
  { x: 40, y: -26, s: 0.12, d: 1.7, delay: 1.2 },
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

const STATIC_FACES = [1, 3, 5]

function Cube({ die, size, style, className, only }: { die: DieDef; size: number; style?: CSSProperties; className?: string; only?: number[] }) {
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d', ...style }}>
      <Faces die={die} size={size} only={only} />
    </div>
  )
}

function Faces({ die, size, only }: { die: DieDef; size: number; only?: number[] }) {
  const half = size / 2
  const faces: { n: number; t: string }[] = [
    { n: 1, t: `translateZ(${half}px)` },
    { n: 6, t: `rotateY(180deg) translateZ(${half}px)` },
    { n: 2, t: `rotateY(90deg) translateZ(${half}px)` },
    { n: 5, t: `rotateY(-90deg) translateZ(${half}px)` },
    { n: 3, t: `rotateX(90deg) translateZ(${half}px)` },
    { n: 4, t: `rotateX(-90deg) translateZ(${half}px)` },
  ].filter((f) => !only || only.includes(f.n))
  return (
    <>
      {faces.map((f) => (
        <div
          key={f.n}
          className="absolute inset-0 overflow-hidden"
          style={{
            transform: f.t,
            background: die.face,
            border: `1px solid ${die.edge}`,
            borderRadius: '18%',
            boxShadow: `inset 0 0 ${size * 0.14}px rgba(0,0,0,0.28)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* lesk – statický, kocka sa točí, takže sa aj tak mení */}
          {die.shine && <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 42%, transparent 70%, rgba(255,255,255,0.12) 100%)' }} />}
          <FaceMarks die={die} size={size} n={f.n} />
        </div>
      ))}
    </>
  )
}

/** Zamknutá kocka v zbierke: silueta s otáznikom */
export function DieSilhouette({ size = 64 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center font-display text-faint"
      style={{ width: size, height: size, borderRadius: '18%', background: 'var(--t-track)', border: '1px dashed var(--t-line-strong)', fontSize: size * 0.45 }}
    >
      ?
    </div>
  )
}

/** Oká na jednej stene: bodky, kosoštvorce, hviezdy, rímske číslo alebo erb na jednotke */
function FaceMarks({ die, size, n }: { die: DieDef; size: number; n: number }) {
  const glow = die.pipGlow ? `0 0 ${size * 0.1}px ${die.pip}` : undefined
  const text = (content: string, fontSize: number, className = '') => (
    <span
      className={`absolute inset-0 grid place-items-center leading-none ${className}`}
      style={{ color: die.pip, fontSize, textShadow: glow ?? '0 1px 1px rgba(0,0,0,0.35)' }}
    >
      {content}
    </span>
  )

  if (n === 1 && die.emblem) return text(die.emblem, size * (Array.from(die.emblem).length > 1 || /\p{Extended_Pictographic}/u.test(die.emblem) ? 0.5 : 0.58), 'font-display')
  if (die.pipStyle === 'roman') return text(ROMAN[n - 1], size * (n === 3 || n === 6 ? 0.3 : 0.38), 'font-display')

  return (
    <>
      {PIPS[n].map(([x, y], i) => {
        const pos = { left: `${x}%`, top: `${y}%` }
        if (die.pipStyle === 'stars')
          return (
            <span key={i} className="absolute leading-none" style={{ ...pos, transform: 'translate(-50%,-52%)', fontSize: size * 0.24, color: die.pip, textShadow: glow }}>
              ★
            </span>
          )
        return (
          <span
            key={i}
            className={`absolute ${die.pipStyle === 'diamonds' ? '' : 'rounded-full'}`}
            style={{
              ...pos,
              width: size * (die.pipStyle === 'diamonds' ? 0.14 : 0.17),
              height: size * (die.pipStyle === 'diamonds' ? 0.14 : 0.17),
              borderRadius: die.pipStyle === 'diamonds' ? 2 : undefined,
              transform: die.pipStyle === 'diamonds' ? 'translate(-50%,-50%) rotate(45deg)' : 'translate(-50%,-50%)',
              background: die.pip,
              boxShadow: die.pipGlow ? `0 0 ${size * 0.1}px ${die.pip}, inset 0 1px 2px rgba(255,255,255,0.4)` : 'inset 0 2px 3px rgba(0,0,0,0.45)',
            }}
          />
        )
      })}
    </>
  )
}
