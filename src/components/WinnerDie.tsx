import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DieDef } from '../lib/dice'
import { sfx } from '../lib/sound'
import { Die3D } from './Die3D'

const SIZE = 52
const BIG = 2.6

type Stage = 'drop' | 'land' | 'fly'

/**
 * Slávnostný príchod víťaznej kocky: spadne z neba doprostred obrazovky, odrazí sa,
 * dopadne šestkou hore v lúčoch svetla a potom odletí k víťazovi, kde ostane krúžiť.
 */
export function WinnerDie({ die, target, onDone }: { die: DieDef; target: () => { x: number; y: number } | null; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('drop')
  const [to, setTo] = useState({ x: 0, y: 0 })
  const cx = window.innerWidth / 2
  const cy = window.innerHeight * 0.45
  const fall = window.innerHeight * 0.75

  // časovače namiesto konca animácie – fungujú aj keď appka na chvíľu zájde do pozadia
  useEffect(() => {
    const t = [
      setTimeout(() => {
        setStage('land')
        sfx.triumph()
      }, 850),
      setTimeout(() => {
        const p = target()
        setTo(p ? { x: p.x - cx, y: p.y - cy } : { x: 0, y: -cy })
        setStage('fly')
      }, 2500),
      setTimeout(onDone, 3150),
    ]
    return () => t.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stars = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        const r = 110 + Math.random() * 90
        return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: Math.random() * 0.4, s: 10 + Math.random() * 10 }
      }),
    [],
  )

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* stmavenie, aby kocka vynikla */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 45%, rgba(0,0,0,0.15), rgba(0,0,0,0.6))' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 'fly' ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      />

      {stage === 'land' && (
        <>
          {/* zlaté lúče */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: cx - 170,
              top: cy - 170,
              width: 340,
              height: 340,
              background: 'repeating-conic-gradient(rgba(255,220,120,0.55) 0 8deg, transparent 8deg 22deg)',
              maskImage: 'radial-gradient(circle, black 18%, transparent 68%)',
              WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 68%)',
            }}
            initial={{ scale: 0.2, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 40 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
          {/* tlakové kruhy pri dopade */}
          {[0, 0.15].map((delay) => (
            <motion.div
              key={delay}
              className="absolute rounded-full"
              style={{ left: cx - 50, top: cy - 50, width: 100, height: 100, border: '4px solid #ffd76a', boxShadow: '0 0 20px #ffd76a' }}
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.9, delay, ease: 'easeOut' }}
            />
          ))}
          {/* trblietky */}
          {stars.map((s, i) => (
            <motion.div
              key={i}
              className="absolute text-[#ffe08a]"
              style={{ left: cx - s.s / 2, top: cy - s.s / 2, fontSize: s.s, lineHeight: 1, textShadow: '0 0 8px #ffbf3f' }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x: s.x, y: s.y, scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, delay: s.d, ease: 'easeOut' }}
            >
              ✦
            </motion.div>
          ))}
        </>
      )}

      <motion.div
        className="absolute"
        style={{ left: cx - SIZE / 2, top: cy - SIZE / 2 }}
        initial={{ y: -fall, scale: BIG, rotate: -40 }}
        animate={
          stage === 'drop'
            ? { y: [-fall, 0, -55, 0, -14, 0], rotate: [-40, 0, 8, 0, 2, 0], scale: BIG }
            : stage === 'land'
              ? { y: 0, x: 0, rotate: 0, scale: [BIG, BIG * 1.12, BIG] }
              : { x: to.x, y: to.y, scale: 0.65, rotate: 0 }
        }
        transition={
          stage === 'drop'
            ? { duration: 0.85, times: [0, 0.45, 0.62, 0.78, 0.9, 1], ease: 'easeIn' }
            : stage === 'land'
              ? { duration: 0.5 }
              : { duration: 0.6, ease: [0.6, 0, 0.3, 1] }
        }
      >
        <div style={{ filter: stage === 'land' ? 'drop-shadow(0 0 10px rgba(255,210,100,0.9))' : undefined }}>
          <Die3D die={die} size={SIZE} rolling={stage === 'drop'} show={stage === 'drop' ? null : 6} />
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
