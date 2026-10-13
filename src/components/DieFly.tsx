import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { DieDef } from '../lib/dice'
import { Die3D } from './Die3D'

/**
 * Veľký ťah (1 000+): obľúbená kocka vyskočí zo svojho miesta, prekotúľa sa cez displej
 * a vyletí z neho smerom k hráčom – rastie, točí sa a nakoniec zmizne.
 */
export function DieFly({ die, from, onDone }: { die: DieDef; from: { x: number; y: number }; onDone: () => void }) {
  const dx = window.innerWidth / 2 - from.x
  const dy = window.innerHeight * 0.42 - from.y
  const size = 52

  // poistka: keď appka zájde do pozadia, animácia nemusí skončiť – kocka aj tak zmizne
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <motion.div
        className="absolute"
        style={{ left: from.x - size / 2, top: from.y - size / 2 }}
        initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
        animate={{
          // poskok hore, dopad, odraz… a potom rovno do tváre
          x: [0, dx * 0.15 - 70, dx * 0.45 + 60, dx * 0.7 - 30, dx],
          y: [0, -130, 10, -70, dy],
          scale: [1, 1.5, 1.9, 2.8, 11],
          rotate: [0, -140, -250, -400, -560],
          opacity: [1, 1, 1, 1, 0],
          filter: ['blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'],
        }}
        transition={{ duration: 1.6, times: [0, 0.22, 0.42, 0.6, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] }}
        onAnimationComplete={onDone}
      >
        <Die3D die={die} size={size} rolling />
      </motion.div>
    </div>
  )
}
