import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { THEMES } from '../lib/themes'
import type { ThemeId } from '../lib/types'

/** Pozadie celej appky. Pri zmene témy sa staré pozadie plynule prelína do nového. */
export function ThemeLayer({ themeId, dice }: { themeId: ThemeId; dice?: boolean }) {
  const theme = THEMES[themeId]

  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.dataset.style = theme.style
    root.style.colorScheme = theme.scheme
    // farba celého plátna (aj pod stavovým riadkom a lištou iPhonu). Musí byť na <html>, nie na <body> –
    // farba na <body> by sa pri farbe na <html> kreslila NAD pozadím témy (hviezdy, planéta…)
    root.style.background = theme.base
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.base)
  }, [theme])

  return (
    // iPhone (najmä appka z plochy) obmedzí `fixed inset-0` na bezpečnú zónu – pozadie preto
    // natiahneme aj pod stavový riadok a spodnú lištu, aby išlo cez celý displej
    <div
      className="pointer-events-none fixed inset-x-0 -z-10 overflow-hidden"
      style={{ top: 'calc(-1 * env(safe-area-inset-top))', bottom: 'calc(-1 * env(safe-area-inset-bottom))' }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={theme.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          style={{ background: theme.background }}
        >
          {theme.overlay && (
            <div
              className="absolute inset-0"
              // bez mix-blend-mode: prelínanie s celou obrazovkou by mobil prepočítaval pri každej animácii
              style={{ backgroundImage: theme.overlay, backgroundSize: theme.overlaySize, opacity: theme.scheme === 'light' ? 0.32 : 1 }}
            />
          )}
          {theme.decor === 'stars' && <Stars />}
          {theme.decor === 'embers' && <Embers />}
          {theme.decor === 'grid' && <NeonGrid />}
          {theme.vignette && (
            <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
          )}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>{dice && <FloatingDice key="dice" />}</AnimatePresence>
    </div>
  )
}

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 2 + 0.5,
        d: Math.random() * 4 + 2,
        delay: Math.random() * 4,
      })),
    [],
  )
  return (
    <>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animation: `twinkle ${s.d}s ease-in-out ${s.delay}s infinite` }}
        />
      ))}
      <div className="absolute -right-16 top-24 h-40 w-40 rounded-full opacity-70" style={{ background: 'radial-gradient(circle at 30% 30%, #b9a8ff, #4b3bbf 60%, #1a1250)', boxShadow: '0 0 80px rgba(139,123,255,0.5)' }} />
    </>
  )
}

function Embers() {
  const embers = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        s: Math.random() * 4 + 2,
        d: Math.random() * 6 + 6,
        delay: Math.random() * 8,
      })),
    [],
  )
  return (
    <>
      {embers.map((e) => (
        <span
          key={e.id}
          className="absolute bottom-[-10px] rounded-full"
          style={{
            left: `${e.x}%`,
            width: e.s,
            height: e.s,
            background: '#ffb347',
            boxShadow: '0 0 10px 2px rgba(255,120,40,0.8)',
            animation: `rise ${e.d}s linear ${e.delay}s infinite`,
          }}
        />
      ))}
    </>
  )
}

function NeonGrid() {
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[45%] opacity-50"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,61,242,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,228,255,0.4) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        transform: 'perspective(400px) rotateX(60deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        animation: 'gridmove 2.5s linear infinite',
      }}
    />
  )
}

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function FloatingDice() {
  const dice = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        face: FACES[i % 6],
        x: Math.random() * 90,
        y: Math.random() * 90,
        size: 28 + Math.random() * 36,
        dur: 10 + Math.random() * 10,
        rot: Math.random() > 0.5 ? 360 : -360,
      })),
    [],
  )
  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      {dice.map((d) => (
        // CSS animácia namiesto JavaScriptu – beží na grafickom čipe
        <span
          key={d.id}
          className="absolute select-none text-accent opacity-[0.13]"
          style={{ left: `${d.x}%`, top: `${d.y}%`, fontSize: d.size, lineHeight: 1, animation: `drift ${d.dur}s linear infinite`, ['--rot' as string]: `${d.rot}deg` }}
        >
          {d.face}
        </span>
      ))}
    </motion.div>
  )
}
