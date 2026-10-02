import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { sfx } from '../lib/sound'

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
}

/** 3D kocka – pomaly sa točí, po ťuknutí sa "hodí". */
export function DieLogo({ size = 96 }: { size?: number }) {
  const controls = useAnimationControls()
  const rot = useRef({ x: -20, y: 30 })
  const half = size / 2
  const faces: { n: number; t: string }[] = [
    { n: 1, t: `translateZ(${half}px)` },
    { n: 6, t: `rotateY(180deg) translateZ(${half}px)` },
    { n: 2, t: `rotateY(90deg) translateZ(${half}px)` },
    { n: 5, t: `rotateY(-90deg) translateZ(${half}px)` },
    { n: 3, t: `rotateX(90deg) translateZ(${half}px)` },
    { n: 4, t: `rotateX(-90deg) translateZ(${half}px)` },
  ]

  // token zabráni tomu, aby sa staré animačné reťazce miešali s novými
  const token = useRef(0)

  const idle = (t: number) => {
    if (t !== token.current) return
    rot.current.y += 360
    void controls
      .start({ rotateX: rot.current.x, rotateY: rot.current.y, transition: { duration: 14, ease: 'linear' } })
      .then(() => idle(t))
  }

  useEffect(() => {
    const t = ++token.current
    controls.set({ rotateX: rot.current.x, rotateY: rot.current.y })
    idle(t)
    return () => {
      token.current++
      controls.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const roll = () => {
    sfx.flip()
    const t = ++token.current
    controls.stop()
    rot.current.x = Math.round(rot.current.x / 90) * 90 + 720 + Math.round(Math.random() * 3) * 90 - 20
    rot.current.y = Math.round(rot.current.y / 90) * 90 + 720 + Math.round(Math.random() * 3) * 90 + 30
    void controls
      .start({ rotateX: rot.current.x, rotateY: rot.current.y, transition: { duration: 1.2, ease: [0.2, 0.9, 0.3, 1] } })
      .then(() => idle(t))
  }

  return (
    <motion.button
      onClick={roll}
      whileTap={{ scale: 0.9 }}
      style={{ width: size, height: size, perspective: 600 }}
      aria-label="Hodiť kockou"
    >
      <motion.div animate={controls} style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d' }}>
        {faces.map((f) => (
          <div
            key={f.n}
            className="absolute inset-0 rounded-[22%]"
            style={{
              transform: f.t,
              background: 'linear-gradient(135deg, #fffaf0, #f1e2c6)',
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.25)',
              backfaceVisibility: 'hidden',
            }}
          >
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
                  background: f.n === 1 ? 'var(--t-accent2)' : '#2a1a0e',
                  boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.5)',
                }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </motion.button>
  )
}
