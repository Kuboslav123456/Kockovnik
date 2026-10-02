import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { fmt } from '../lib/game'
import type { BurstId } from '../lib/types'

/** Animácia nad kartou hráča po zapísaní bodov. Typ si hráč odomyká v Dobrodružstve. */
export function Burst({ burst, points, onDone }: { burst: BurstId; points: number; onDone: () => void }) {
  const label = `+${fmt(points)}`

  // nula sa v hre zobrazuje preškrtnutím riadku, nie animáciou
  if (points === 0) return null

  if (burst === 'explode') return <Explode label={label} onDone={onDone} />
  if (burst === 'lightning') return <Lightning label={label} onDone={onDone} />
  if (burst === 'fire') return <Fire label={label} onDone={onDone} />

  // Vyletenie: číslo vyletí nad riadok a zmizne
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.4 }}
      animate={{ opacity: [0, 1, 0], y: -44, scale: [0.4, 1.25, 1] }}
      transition={{ duration: 1.1, ease: [0.2, 0.9, 0.3, 1] }}
      onAnimationComplete={onDone}
      className="num-weight text-glow pointer-events-none absolute right-14 top-0 text-2xl text-accent"
    >
      {label}
    </motion.div>
  )
}

function Explode({ label, onDone }: { label: string; onDone: () => void }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3
        const d = 60 + Math.random() * 60
        return { id: i, x: Math.cos(a) * d, y: Math.sin(a) * d * 0.6, s: 4 + Math.random() * 6, c: i % 2 ? 'var(--t-accent)' : 'var(--t-accent2)' }
      }),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible">
      <motion.div
        className="absolute h-16 w-16 rounded-full border-4 border-accent"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{ width: s.s, height: s.s, background: s.c, boxShadow: `0 0 8px ${s.c}` }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.8, ease: [0.1, 0.8, 0.3, 1] }}
        />
      ))}
      <motion.div
        className="text-glow relative text-4xl font-black text-accent"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.6, 1.15, 1.15], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.4, times: [0, 0.2, 0.4, 1] }}
        onAnimationComplete={onDone}
      >
        {label}
      </motion.div>
    </div>
  )
}

function Lightning({ label, onDone }: { label: string; onDone: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible">
      <motion.div
        className="absolute inset-0 rounded-3xl bg-white"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: [0.9, 0, 0.6, 0] }}
        transition={{ duration: 0.5, times: [0, 0.3, 0.45, 1] }}
      />
      {[-1, 1].map((side) => (
        <motion.span
          key={side}
          className="absolute text-4xl"
          style={{ left: side < 0 ? '12%' : undefined, right: side > 0 ? '12%' : undefined, filter: 'drop-shadow(0 0 10px #fff200)' }}
          initial={{ y: -50, opacity: 0, rotate: side * 15 }}
          animate={{ y: [-50, 0, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1, times: [0, 0.15, 1] }}
        >
          ⚡
        </motion.span>
      ))}
      <motion.div
        className="relative text-4xl font-black"
        style={{ color: '#fff7a8', textShadow: '0 0 12px #fff200, 0 0 30px var(--t-glow)' }}
        initial={{ y: -60, scale: 1.8, opacity: 0 }}
        animate={{ y: [-60, 0, 0, -10], scale: [1.8, 1, 1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.3, times: [0, 0.12, 0.75, 1], ease: 'easeOut' }}
        onAnimationComplete={onDone}
      >
        {label}
      </motion.div>
    </div>
  )
}

function Fire({ label, onDone }: { label: string; onDone: () => void }) {
  const flames = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ id: i, x: 5 + Math.random() * 90, d: Math.random() * 0.4, s: 18 + Math.random() * 18 })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{ background: 'radial-gradient(80% 90% at 50% 100%, rgba(255,110,20,0.55), transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.4 }}
      />
      {flames.map((f) => (
        <motion.span
          key={f.id}
          className="absolute bottom-0"
          style={{ left: `${f.x}%`, fontSize: f.s }}
          initial={{ y: 10, opacity: 0, scale: 0.5 }}
          animate={{ y: -70, opacity: [0, 1, 0], scale: [0.5, 1.1, 0.4] }}
          transition={{ duration: 1.1, delay: f.d, ease: 'easeOut' }}
        >
          🔥
        </motion.span>
      ))}
      <motion.div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-4xl font-black"
        style={{ color: '#ffd23f', textShadow: '0 0 10px #ff6a1f, 0 0 26px #ff3d00' }}
        initial={{ y: 20, opacity: 0, scale: 0.7 }}
        animate={{ y: [20, -6, -30], opacity: [0, 1, 0], scale: [0.7, 1.2, 1] }}
        transition={{ duration: 1.5, times: [0, 0.3, 1] }}
        onAnimationComplete={onDone}
      >
        {label}
      </motion.div>
    </div>
  )
}
