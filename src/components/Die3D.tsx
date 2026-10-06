import { animate, motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
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

/**
 * 3D kocka z Klenotnice. `idle` = pomaly sa točí, `interactive` = dá sa otáčať prstom.
 * Ostatné kocky stoja v pootočenej polohe, aby boli vidieť tri steny.
 */
export function Die3D({
  die,
  size = 64,
  idle = false,
  interactive = false,
  speed = 1,
  rolling = false,
  show = null,
}: {
  die: DieDef
  size?: number
  idle?: boolean
  interactive?: boolean
  speed?: number
  /** rýchle točenie počas hodu */
  rolling?: boolean
  /** po hode dopadne touto stenou dopredu */
  show?: number | null
}) {
  const rx = useMotionValue(-24)
  const ry = useMotionValue(36)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const half = size / 2

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

  const faces: { n: number; t: string }[] = [
    { n: 1, t: `translateZ(${half}px)` },
    { n: 6, t: `rotateY(180deg) translateZ(${half}px)` },
    { n: 2, t: `rotateY(90deg) translateZ(${half}px)` },
    { n: 5, t: `rotateY(-90deg) translateZ(${half}px)` },
    { n: 3, t: `rotateX(90deg) translateZ(${half}px)` },
    { n: 4, t: `rotateX(-90deg) translateZ(${half}px)` },
  ]

  return (
    <div
      style={{ width: size, height: size, perspective: size * 7, filter: die.glow ? `drop-shadow(0 0 ${size * 0.18}px ${die.glow})` : undefined, touchAction: interactive ? 'none' : undefined }}
      onPointerDown={
        interactive
          ? (e) => {
              drag.current = { x: e.clientX, y: e.clientY }
              ;(e.target as Element).setPointerCapture?.(e.pointerId)
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              if (!drag.current) return
              ry.set(ry.get() + (e.clientX - drag.current.x) * 0.6)
              rx.set(rx.get() - (e.clientY - drag.current.y) * 0.6)
              drag.current = { x: e.clientX, y: e.clientY }
            }
          : undefined
      }
      onPointerUp={interactive ? () => (drag.current = null) : undefined}
      onPointerCancel={interactive ? () => (drag.current = null) : undefined}
    >
      <motion.div style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d', rotateX: rx, rotateY: ry }}>
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
            {die.shine && <div className="shimmer absolute inset-0 opacity-60" />}
            {PIPS[f.n].map(([x, y], i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size * 0.17,
                  height: size * 0.17,
                  transform: 'translate(-50%,-50%)',
                  background: die.pip,
                  boxShadow: die.pipGlow ? `0 0 ${size * 0.1}px ${die.pip}, inset 0 1px 2px rgba(255,255,255,0.4)` : 'inset 0 2px 3px rgba(0,0,0,0.45)',
                }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
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
