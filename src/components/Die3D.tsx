import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { useRef } from 'react'
import type { DieDef } from '../lib/dice'

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
}

/**
 * 3D kocka z Klenotnice. `idle` = pomaly sa točí, `interactive` = dá sa otáčať prstom.
 * Ostatné kocky stoja v pootočenej polohe, aby boli vidieť tri steny.
 */
export function Die3D({ die, size = 64, idle = false, interactive = false, speed = 1 }: { die: DieDef; size?: number; idle?: boolean; interactive?: boolean; speed?: number }) {
  const rx = useMotionValue(-24)
  const ry = useMotionValue(36)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const half = size / 2

  useAnimationFrame((_, dt) => {
    if (!idle || drag.current) return
    ry.set(ry.get() + dt * 0.035 * speed)
    rx.set(rx.get() + dt * 0.012 * speed)
  })

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
