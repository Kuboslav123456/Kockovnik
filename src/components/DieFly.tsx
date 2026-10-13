import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DieDef } from '../lib/dice'
import { Die3D } from './Die3D'

const SIZE = 52
/** kedy pri výbuchu kocka praskne (ms) */
const BOOM_AT = 1000

/**
 * Veľký ťah: obľúbená kocka vyskočí zo svojho miesta a prekotúľa sa cez displej.
 *  • 1 000+ – vyletí z displeja smerom k hráčom (rastie, točí sa, zmizne)
 *  • 5 000+ (`explode`) – doskáče doprostred, roztrasie sa a vybuchne na úlomky
 */
export function DieFly({
  die,
  from,
  explode = false,
  onBoom,
  onDone,
}: {
  die: DieDef
  from: { x: number; y: number }
  explode?: boolean
  onBoom?: () => void
  onDone: () => void
}) {
  const dx = window.innerWidth / 2 - from.x
  const dy = window.innerHeight * 0.42 - from.y
  const [boom, setBoom] = useState(false)

  // časovače namiesto konca animácie: keď appka zájde do pozadia, animácia nemusí dobehnúť
  useEffect(() => {
    const timers = [setTimeout(onDone, explode ? 2900 : 2000)]
    if (explode)
      timers.push(
        setTimeout(() => {
          setBoom(true)
          onBoom?.()
        }, BOOM_AT),
      )
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fly = {
    // poskok hore, dopad, odraz… a potom rovno do tváre
    x: [0, dx * 0.15 - 70, dx * 0.45 + 60, dx * 0.7 - 30, dx],
    y: [0, -130, 10, -70, dy],
    scale: [1, 1.5, 1.9, 2.8, 11],
    rotate: [0, -140, -250, -400, -560],
    opacity: [1, 1, 1, 1, 0],
    filter: ['blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'],
  }
  const blowUp = {
    // doskáče doprostred, rastie, trasie sa čoraz viac… a praskne
    x: [0, dx * 0.3 - 60, dx * 0.7 + 40, dx, dx - 7, dx + 8, dx - 9, dx + 10, dx],
    y: [0, -140, 0, dy, dy + 5, dy - 6, dy + 7, dy - 8, dy],
    scale: [1, 1.6, 2, 3, 3.1, 3.3, 3.5, 3.8, 4.6],
    rotate: [0, -160, -300, -390, -380, -400, -378, -402, -390],
    opacity: [1, 1, 1, 1, 1, 1, 1, 1, 0],
    filter: ['brightness(1)', 'brightness(1)', 'brightness(1)', 'brightness(1.1)', 'brightness(1.3)', 'brightness(1.5)', 'brightness(1.8)', 'brightness(2.3)', 'brightness(4)'],
  }

  // portál do <body>: obrazovka hry sa pri výbuchu trasie (transform) a `fixed` by sa inak viazal na ňu
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <motion.div
        className="absolute"
        style={{ left: from.x - SIZE / 2, top: from.y - SIZE / 2 }}
        initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
        animate={explode ? blowUp : fly}
        transition={
          explode
            ? { duration: BOOM_AT / 1000, times: [0, 0.2, 0.38, 0.6, 0.68, 0.76, 0.84, 0.94, 1], ease: 'easeInOut' }
            : { duration: 1.6, times: [0, 0.22, 0.42, 0.6, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] }
        }
      >
        <Die3D die={die} size={SIZE} rolling={!explode || !boom} />
      </motion.div>
      {boom && <Explosion die={die} x={window.innerWidth / 2} y={window.innerHeight * 0.42} />}
    </div>,
    document.body,
  )
}

/** záblesk, tlaková vlna, úlomky kocky a iskry */
function Explosion({ die, x, y }: { die: DieDef; x: number; y: number }) {
  const shards = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + Math.random() * 0.35
        const dist = 170 + Math.random() * 260
        return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, size: 14 + Math.random() * 22, spin: (Math.random() - 0.5) * 900, pip: Math.random() < 0.6 }
      }),
    [],
  )
  const sparks = useMemo(
    () =>
      Array.from({ length: 28 }, () => {
        const a = Math.random() * Math.PI * 2
        const dist = 120 + Math.random() * 380
        return { dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, size: 3 + Math.random() * 5, delay: Math.random() * 0.08 }
      }),
    [],
  )
  const fire = die.glow ?? '#ffb347'

  return (
    <>
      {/* záblesk celej obrazovky */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at ${x}px ${y}px, #fffbe8 0%, ${fire} 22%, rgba(255,90,20,0.55) 45%, transparent 75%)` }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {/* ohnivá guľa */}
      <motion.div
        className="absolute rounded-full"
        style={{ left: x - 60, top: y - 60, width: 120, height: 120, background: `radial-gradient(circle, #fff 0%, #ffe28a 30%, #ff7a1a 60%, rgba(160,30,0,0) 72%)` }}
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 3.2, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {/* tlaková vlna */}
      {[0, 0.12].map((delay) => (
        <motion.div
          key={delay}
          className="absolute rounded-full"
          style={{ left: x - 50, top: y - 50, width: 100, height: 100, border: `${delay ? 3 : 6}px solid ${fire}`, boxShadow: `0 0 24px ${fire}` }}
          initial={{ scale: 0.2, opacity: 0.95 }}
          animate={{ scale: 9, opacity: 0 }}
          transition={{ duration: 0.85, delay, ease: 'easeOut' }}
        />
      ))}
      {/* úlomky kocky – padajú aj trochu dole */}
      {shards.map((s, i) => (
        <motion.div
          key={`s${i}`}
          className="absolute"
          style={{
            left: x - s.size / 2,
            top: y - s.size / 2,
            width: s.size,
            height: s.size,
            background: die.face,
            border: `1px solid ${die.edge}`,
            borderRadius: '22%',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.35)',
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1.2 }}
          animate={{ x: [0, s.dx * 0.8, s.dx], y: [0, s.dy * 0.8, s.dy + 140], rotate: s.spin, opacity: [1, 1, 0], scale: 0.7 }}
          transition={{ duration: 1.5, times: [0, 0.45, 1], ease: 'easeOut' }}
        >
          {s.pip && (
            <span className="absolute left-1/2 top-1/2 rounded-full" style={{ width: s.size * 0.3, height: s.size * 0.3, transform: 'translate(-50%,-50%)', background: die.pip }} />
          )}
        </motion.div>
      ))}
      {/* iskry */}
      {sparks.map((s, i) => (
        <motion.div
          key={`k${i}`}
          className="absolute rounded-full"
          style={{ left: x - s.size / 2, top: y - s.size / 2, width: s.size, height: s.size, background: '#fff3c4', boxShadow: `0 0 8px ${fire}, 0 0 16px #ff7a1a` }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: s.dx, y: s.dy + 60, opacity: 0 }}
          transition={{ duration: 0.9, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}
