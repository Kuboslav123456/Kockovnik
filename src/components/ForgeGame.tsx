import { AnimatePresence, motion, useAnimationControls, useAnimationFrame, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DieDef } from '../lib/dice'
import type { ForgeQuality } from '../lib/types'
import { sfx } from '../lib/sound'
import { Die3D } from './Die3D'
import { Btn } from './ui'

/** rýchlosť ručičky (ms na jeden prebeh) a šírka zón pre 1., 2. a 3. úder */
export const STRIKES = [
  { sweep: 1100, good: 0.12, perfect: 0.045 },
  { sweep: 850, good: 0.1, perfect: 0.038 },
  { sweep: 800, good: 0.085, perfect: 0.032 },
]

export function scoreToQuality(total: number): ForgeQuality {
  return total >= 5 ? 'master' : total >= 3 ? 'journeyman' : 'apprentice'
}

type Hit = 0 | 1 | 2

// ---- rozloženie scény (px) ----
const SW = 290
const SH = 292
const DIE = 62
const DIE_X = 138 // stred kocky
const ANVIL_TOP = 206
const DIE_TOP = ANVIL_TOP - DIE
// kladivo: úderná plocha hlavy je v SVG na (18, 52), os otáčania na konci rúčky (148, 26)
const HAMMER_LEFT = DIE_X - 18
const HAMMER_TOP = DIE_TOP - 52
const H_IDLE = 46
const H_WIND = 62
/** vedro na kalenie: stred vpravo od nákovy */
const BUCKET_X = DIE_X + 110
/** kedy kladivo dopadne po stlačení (ms) */
const CONTACT = 210

/**
 * Minihra kovania: ručička behá po stupnici, hráč trikrát udrie kladivom.
 * Po treťom údere sa kocka zakalí – spadne do vedra s vodou, zasyčí a vynorí sa vychladnutá.
 */
export function ForgeGame({ die, quenching, onStrikesDone }: { die: DieDef; quenching: boolean; onStrikesDone: (q: ForgeQuality) => void }) {
  const [strike, setStrike] = useState(0)
  const [hits, setHits] = useState<Hit[]>([])
  const [phase, setPhase] = useState<'aim' | 'swing' | 'result'>('aim')
  const [impact, setImpact] = useState<{ key: number; h: Hit } | null>(null)
  const [marker, setMarker] = useState<number | null>(null)
  const [cooled, setCooled] = useState(false)
  const zone = useMemo(() => 0.2 + Math.random() * 0.6, [strike]) // eslint-disable-line react-hooks/exhaustive-deps
  const pos = useMotionValue(0)
  const t = useRef(0)
  const needle = useTransform(pos, (v) => `${v * 100}%`)
  const cfg = STRIKES[Math.min(strike, STRIKES.length - 1)]
  const done = hits.length >= STRIKES.length

  const hammer = useAnimationControls()
  const scene = useAnimationControls()
  const dieCtl = useAnimationControls()

  useEffect(() => {
    void hammer.start({ rotate: H_IDLE, transition: { duration: 0 } })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ručička behá tam a späť; počas úderu stojí
  useAnimationFrame((_, dt) => {
    if (phase !== 'aim' || done) return
    t.current += dt
    const c = (t.current % (cfg.sweep * 2)) / cfg.sweep
    pos.set(c <= 1 ? c : 2 - c)
  })

  // kalenie: kocka skočí do vedra, šplechne, zasyčí a vynorí sa vychladnutá
  useEffect(() => {
    if (!quenching) return
    void dieCtl.start({
      x: [0, 40, 110, 110, 110],
      y: [0, -80, 76, 76, 6],
      scale: [1, 1, 0.8, 0.8, 1],
      rotate: [0, 90, 200, 200, 360],
      transition: { duration: 2.2, times: [0, 0.16, 0.3, 0.72, 1], ease: ['easeOut', 'easeIn', 'linear', 'easeOut'] },
    })
    const a = setTimeout(() => {
      sfx.splash()
      sfx.hiss()
      setCooled(true)
    }, 660)
    return () => clearTimeout(a)
  }, [quenching]) // eslint-disable-line react-hooks/exhaustive-deps

  const hit = () => {
    if (phase !== 'aim' || done || quenching) return
    const p = pos.get()
    const d = Math.abs(p - zone)
    const h: Hit = d <= cfg.perfect ? 2 : d <= cfg.good ? 1 : 0
    setPhase('swing')
    setMarker(p)
    sfx.swing()
    // nápřah – úder – odskok – späť do pokoja
    void hammer.start({
      rotate: [H_IDLE, H_WIND, -2, 14, H_IDLE],
      transition: { duration: 0.85, times: [0, 0.14, 0.25, 0.42, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeInOut'] },
    })
    setTimeout(() => {
      sfx.clang(h)
      setImpact({ key: Date.now(), h })
      const k = h === 2 ? 1.6 : h === 1 ? 1 : 0.5
      void scene.start({ x: [0, -6 * k, 5 * k, -3 * k, 0], y: [0, 4 * k, -3 * k, 1, 0], transition: { duration: 0.35 } })
      void dieCtl.start({ scaleY: [1, 0.74, 1.08, 1], scaleX: [1, 1.18, 0.96, 1], transition: { duration: 0.42 } })
      const next = [...hits, h]
      setHits(next)
      setPhase('result')
      setTimeout(() => {
        if (next.length >= STRIKES.length) {
          onStrikesDone(scoreToQuality(next.reduce<number>((a, x) => a + x, 0)))
          return
        }
        t.current = 0
        setMarker(null)
        setStrike((s) => s + 1)
        setPhase('aim')
      }, 900)
    }, CONTACT)
  }

  const last = hits[hits.length - 1]
  const hot = !cooled

  return (
    <div className="px-4" onPointerDown={(e) => (e.target as HTMLElement).closest('button') || hit()}>
      <motion.div
        animate={scene}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: [
            'radial-gradient(70% 55% at 30% 45%, rgba(255,120,30,0.35), transparent 70%)',
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.38) 0 2px, transparent 2px 26px)',
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 52px)',
            'linear-gradient(180deg, #2a160c 0%, #1a0d07 60%, #0e0704 100%)',
          ].join(','),
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.7)',
        }}
      >
        <div className="relative mx-auto" style={{ width: SW, height: SH }}>
          <Hearth />

          {/* vedro s vodou na kalenie – vysunie sa zdola */}
          <AnimatePresence>{quenching && <Bucket key="b" />}</AnimatePresence>

          {/* nákova */}
          <Anvil hot={hot} />

          {/* kocka */}
          <motion.div animate={dieCtl} className="absolute z-20" style={{ left: DIE_X - DIE / 2, top: DIE_TOP, width: DIE, height: DIE, transformOrigin: '50% 100%' }}>
            <div
              className="heat-pulse pointer-events-none absolute rounded-full transition-opacity duration-700"
              style={{ inset: -34, background: 'radial-gradient(circle, rgba(255,190,80,0.85), rgba(255,90,0,0.35) 45%, transparent 70%)', opacity: hot ? 1 : 0 }}
            />
            <div className="transition-[filter] duration-700" style={{ filter: hot ? 'sepia(1) saturate(6) hue-rotate(-18deg) brightness(1.35)' : 'none' }}>
              <Die3D die={die} size={DIE} />
            </div>
          </motion.div>

          {/* predná stena vedra – kocka „zmizne“ vo vode */}
          <AnimatePresence>{quenching && <BucketFront key="bf" />}</AnimatePresence>

          {/* kladivo */}
          <motion.div
            animate={hammer}
            initial={{ rotate: H_IDLE }}
            className="absolute z-30"
            style={{ left: HAMMER_LEFT, top: HAMMER_TOP, width: 156, height: 56, transformOrigin: '148px 26px' }}
          >
            <HammerSvg />
          </motion.div>

          {/* iskry a záblesk pri údere */}
          {impact && <Impact key={impact.key} h={impact.h} x={DIE_X} y={DIE_TOP} />}
          {quenching && <Steam />}
        </div>

        {/* hláška */}
        <div className="relative z-40 -mt-2 h-9 text-center">
          <AnimatePresence mode="popLayout">
            {quenching ? (
              <motion.div key="q" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-caps text-xl text-[#cfe8ff]" style={{ textShadow: '0 0 12px rgba(120,190,255,0.7)' }}>
                Kalenie… sssss
              </motion.div>
            ) : phase === 'result' && last != null ? (
              <HitText key={`t${hits.length}`} h={last} />
            ) : (
              <motion.div key={`a${strike}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1 text-sm text-[#e0c0a0]">
                Úder {strike + 1} z 3 · udri, keď je ručička v zlatom poli
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* stupnica */}
        <Gauge zone={zone} cfg={cfg} needle={needle} marker={marker} lastHit={phase === 'result' ? last : undefined} hidden={done} />

        {/* tri údery */}
        <div className="relative z-40 flex justify-center gap-4 pb-4 pt-3">
          {STRIKES.map((_, i) => (
            <StrikeToken key={i} h={hits[i]} active={i === hits.length && !done} />
          ))}
        </div>
      </motion.div>

      <Btn variant="accent" className="mt-4 w-full py-5 text-xl" silent disabled={phase !== 'aim' || done || quenching} onClick={hit}>
        🔨 Udrieť
      </Btn>
      <p className="mt-2 text-center text-xs text-muted">Môžeš ťukať aj kamkoľvek do kováčskej dielne. Svetlý stred poľa = dokonalý úder.</p>
    </div>
  )
}

// ---------------------------------------------------------------- scéna

/** výheň v pozadí: oblúk z kameňa, plamene a uhlíky */
function Hearth() {
  const embers = useMemo(
    () => Array.from({ length: 9 }, () => ({ x: 22 + Math.random() * 70, dx: (Math.random() - 0.5) * 60, d: 2 + Math.random() * 1.8, delay: Math.random() * 2.5, s: 2 + Math.random() * 2.5 })),
    [],
  )
  return (
    <div className="pointer-events-none absolute" style={{ left: 6, top: 40, width: 118, height: 150 }}>
      {/* kamenný oblúk */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: '60px 60px 6px 6px',
          background: 'repeating-linear-gradient(0deg, #3a2418 0 14px, #2a180e 14px 16px)',
          boxShadow: '0 0 30px rgba(255,110,20,0.35)',
        }}
      />
      <div className="absolute overflow-hidden" style={{ left: 12, right: 12, top: 14, bottom: 0, borderRadius: '48px 48px 0 0', background: 'radial-gradient(80% 70% at 50% 100%, #ff9a2a 0%, #b23a06 40%, #2a0c02 85%)' }}>
        {/* plamene */}
        {[
          { l: 8, w: 34, h: 60, d: '0.8s', c: '#ff7a14' },
          { l: 30, w: 38, h: 78, d: '1.05s', c: '#ffb02a' },
          { l: 56, w: 30, h: 56, d: '0.9s', c: '#ff8a1a' },
          { l: 24, w: 46, h: 40, d: '0.7s', c: '#ffe08a' },
        ].map((f, i) => (
          <div
            key={i}
            className="flicker absolute bottom-0"
            style={{
              left: f.l,
              width: f.w,
              height: f.h,
              animationDuration: f.d,
              animationDelay: `${i * 0.13}s`,
              background: `radial-gradient(60% 70% at 50% 85%, #fff4c0 0%, ${f.c} 45%, transparent 75%)`,
              borderRadius: '50% 50% 45% 45% / 70% 70% 30% 30%',
            }}
          />
        ))}
        {/* žeravé uhlie */}
        <div className="absolute inset-x-0 bottom-0 h-4" style={{ background: 'linear-gradient(#ffb347, #c2410c 55%, #3a0c02)' }} />
        {[6, 22, 40, 58, 74].map((l, i) => (
          <span key={l} className="heat-pulse absolute bottom-0.5 rounded-full" style={{ left: l, width: 16, height: 9, animationDelay: `${i * 0.3}s`, background: 'radial-gradient(circle at 50% 40%, #fff0b0, #ff8a1a 50%, #7a1a02)' }} />
        ))}
      </div>
      {/* uhlíky letiace z výhne */}
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember absolute rounded-full"
          style={{
            left: e.x,
            top: 40,
            width: e.s,
            height: e.s,
            background: '#ffd27a',
            boxShadow: '0 0 6px 1px #ff8a1a',
            // bez animácie (obmedzený pohyb) sa uhlíky neukážu
            opacity: 0,
            ['--dx' as string]: `${e.dx}px`,
            ['--d' as string]: `${e.d}s`,
            ['--delay' as string]: `${e.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function Anvil({ hot }: { hot: boolean }) {
  return (
    <svg className="pointer-events-none absolute z-10" style={{ left: DIE_X - 128, top: ANVIL_TOP - 2 }} width={236} height={66} viewBox="0 0 236 66">
      <defs>
        <linearGradient id="anvil-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e737c" />
          <stop offset="0.35" stopColor="#40444b" />
          <stop offset="1" stopColor="#1c1e22" />
        </linearGradient>
        <linearGradient id="anvil-face" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a9098" />
          <stop offset="0.5" stopColor="#c4c9d0" />
          <stop offset="1" stopColor="#7a8088" />
        </linearGradient>
        <radialGradient id="anvil-glow" cx="0.55" cy="0.1" r="0.35">
          <stop offset="0" stopColor="#ffb040" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* roh, telo, pás a nohy */}
      <path
        d="M4 6 C 24 4, 40 2, 58 2 L 214 2 L 214 16 L 196 18 C 184 22, 178 30, 176 40 L 196 52 L 204 64 L 52 64 L 60 52 L 80 40 C 78 30, 72 22, 58 18 L 44 16 C 30 14, 16 11, 4 6 Z"
        fill="url(#anvil-body)"
        stroke="#141518"
        strokeWidth="1.2"
      />
      {/* lesklá pracovná plocha */}
      <path d="M58 2 L 214 2 L 214 7 L 58 7 Z" fill="url(#anvil-face)" />
      <path d="M60 3 L 212 3" stroke="#eef1f4" strokeOpacity="0.7" strokeWidth="0.8" />
      {/* odlesk rozžeravenej kocky */}
      <rect x="58" y="0" width="156" height="22" fill="url(#anvil-glow)" style={{ opacity: hot ? 1 : 0, transition: 'opacity 700ms' }} />
      {/* otvory v nákove */}
      <rect x="186" y="3.5" width="6" height="3" rx="0.6" fill="#1a1c20" />
      <circle cx="176" cy="5" r="1.6" fill="#1a1c20" />
    </svg>
  )
}

function HammerSvg() {
  return (
    <svg width={156} height={56} viewBox="0 0 156 56" style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.5))' }}>
      <defs>
        <linearGradient id="h-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b07a44" />
          <stop offset="0.5" stopColor="#8a5a2e" />
          <stop offset="1" stopColor="#5a3418" />
        </linearGradient>
        <linearGradient id="h-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a4f56" />
          <stop offset="0.3" stopColor="#c9ced6" />
          <stop offset="0.55" stopColor="#8b929c" />
          <stop offset="1" stopColor="#3a3e44" />
        </linearGradient>
      </defs>
      {/* rúčka s letokruhmi */}
      <rect x="30" y="21" width="124" height="10" rx="5" fill="url(#h-wood)" />
      <path d="M44 24 C 70 23, 90 26, 116 24 M50 28 C 76 27, 96 29, 112 28" stroke="#5a3418" strokeOpacity="0.55" strokeWidth="0.8" fill="none" />
      {/* koženú omotávka */}
      <rect x="116" y="19.5" width="38" height="13" rx="5" fill="#3a2416" />
      {[121, 128, 135, 142, 149].map((x) => (
        <path key={x} d={`M${x} 19.5 L ${x + 4} 32.5`} stroke="#5e3c24" strokeWidth="1.6" />
      ))}
      {/* klin a objímka */}
      <rect x="33" y="17" width="7" height="18" rx="1.5" fill="#43474d" />
      {/* hlava kladiva */}
      <rect x="0" y="0" width="36" height="52" rx="4" fill="url(#h-steel)" stroke="#202226" strokeWidth="1.2" />
      <rect x="-1.5" y="45" width="39" height="8" rx="2" fill="#5a5f66" stroke="#202226" strokeWidth="1" />
      <rect x="-1.5" y="-1" width="39" height="7" rx="2" fill="#5a5f66" stroke="#202226" strokeWidth="1" />
      <rect x="7" y="8" width="4" height="34" rx="2" fill="#ffffff" opacity="0.35" />
    </svg>
  )
}

/** iskry, záblesk a tlaková vlna v mieste úderu – podľa presnosti */
function Impact({ h, x, y }: { h: Hit; x: number; y: number }) {
  const sparks = useMemo(() => {
    const n = h === 2 ? 38 : h === 1 ? 22 : 7
    return Array.from({ length: n }, () => {
      const a = (-170 + Math.random() * 160) * (Math.PI / 180)
      const speed = (h === 2 ? 90 : 60) + Math.random() * (h === 2 ? 130 : 90)
      return {
        dx: Math.cos(a) * speed,
        dy: Math.sin(a) * speed,
        rot: (a * 180) / Math.PI + 90,
        len: 7 + Math.random() * (h === 2 ? 16 : 10),
        dur: 0.45 + Math.random() * 0.45,
      }
    })
  }, [h])
  const hotColor = h === 0 ? '#c07a40' : '#ffb347'

  return (
    <div className="pointer-events-none absolute z-40" style={{ left: x, top: y }}>
      {/* záblesk */}
      {h > 0 && (
        <motion.div
          className="absolute rounded-full"
          style={{ left: -60, top: -60, width: 120, height: 120, background: 'radial-gradient(circle, #ffffff 0%, #fff0b0 20%, rgba(255,170,60,0.6) 45%, transparent 70%)' }}
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: h === 2 ? 2.4 : 1.5, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      )}
      {/* tlaková vlna pri dokonalom údere */}
      {h === 2 && (
        <motion.div
          className="absolute rounded-full"
          style={{ left: -40, top: -14, width: 80, height: 28, border: '3px solid #ffd76a', boxShadow: '0 0 14px #ffbf3f' }}
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
      {/* lúče zábleskov pri dokonalom údere */}
      {h === 2 && (
        <motion.div
          className="absolute"
          style={{ left: -70, top: -70, width: 140, height: 140, background: 'repeating-conic-gradient(rgba(255,230,150,0.75) 0 4deg, transparent 4deg 30deg)', borderRadius: '50%', maskImage: 'radial-gradient(circle, black 10%, transparent 65%)', WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 65%)' }}
          initial={{ scale: 0.4, opacity: 1, rotate: 0 }}
          animate={{ scale: 1.6, opacity: 0, rotate: 25 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
      {/* prach pri údere vedľa */}
      {h === 0 &&
        [-1, 1].map((s) => (
          <motion.div
            key={s}
            className="absolute rounded-full"
            style={{ left: -16, top: -10, width: 32, height: 20, background: 'radial-gradient(circle, rgba(180,150,120,0.6), transparent 70%)' }}
            initial={{ x: 0, opacity: 0.9, scale: 0.6 }}
            animate={{ x: s * 40, y: -8, opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      {/* iskry – svetelné čiarky letiace po oblúku (gravitácia) */}
      {sparks.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: -1.25, top: -s.len / 2, width: 2.5, height: s.len, borderRadius: 2, rotate: s.rot, background: `linear-gradient(to bottom, #fffbe8, ${hotColor} 60%, transparent)`, boxShadow: `0 0 6px ${hotColor}` }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: [0, s.dx * 0.75, s.dx], y: [0, s.dy * 0.75, s.dy + 90], opacity: [1, 1, 0] }}
          transition={{ duration: s.dur, ease: 'easeOut', times: [0, 0.55, 1] }}
        />
      ))}
    </div>
  )
}

function Bucket() {
  return (
    <motion.div
      className="pointer-events-none absolute z-10"
      style={{ left: BUCKET_X - 40, top: ANVIL_TOP, width: 80, height: 20 }}
      initial={{ y: 90 }}
      animate={{ y: 0 }}
      exit={{ y: 90 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      {/* hladina vody (za kockou) */}
      <div className="absolute inset-x-1 top-0 h-5 rounded-[50%]" style={{ background: 'radial-gradient(60% 60% at 50% 50%, #7ab8e8, #2a5a8a 70%, #1a3a5a)' }} />
    </motion.div>
  )
}

function BucketFront() {
  return (
    <motion.div
      className="pointer-events-none absolute z-[25]"
      style={{ left: BUCKET_X - 40, top: ANVIL_TOP + 10, width: 80, height: 70 }}
      initial={{ y: 90 }}
      animate={{ y: 0 }}
      exit={{ y: 90 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <svg width={80} height={70} viewBox="0 0 92 62" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bucket" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5a3418" />
            <stop offset="0.45" stopColor="#9a6534" />
            <stop offset="1" stopColor="#4a2a12" />
          </linearGradient>
        </defs>
        <path d="M2 0 L 90 0 L 82 60 L 10 60 Z" fill="url(#bucket)" stroke="#2a180a" strokeWidth="1.5" />
        {[20, 38, 56, 72].map((x) => (
          <path key={x} d={`M${x} 0 L ${x - (x - 46) * 0.08} 60`} stroke="#3a2010" strokeOpacity="0.6" strokeWidth="1" />
        ))}
        <rect x="3" y="10" width="86" height="5" fill="#3a3e44" />
        <rect x="6" y="44" width="80" height="5" fill="#3a3e44" />
      </svg>
      {/* šplech */}
      <Splash />
    </motion.div>
  )
}

function Splash() {
  const drops = useMemo(
    () => Array.from({ length: 16 }, () => ({ dx: (Math.random() - 0.5) * 140, dy: -40 - Math.random() * 80, s: 3 + Math.random() * 4 })),
    [],
  )
  return (
    <div className="absolute left-1/2 top-0">
      {drops.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: d.s, height: d.s * 1.3, background: '#bfe4ff', boxShadow: '0 0 4px rgba(150,210,255,0.8)' }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, d.dx * 0.7, d.dx], y: [0, d.dy, d.dy + 110], opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, delay: 0.62, times: [0, 0.45, 1], ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function Steam() {
  const puffs = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: BUCKET_X - 34 + (i % 4) * 22, s: 40 + Math.random() * 30, d: 0.7 + i * 0.07, dy: 120 + Math.random() * 60 })), [])
  return (
    <div className="pointer-events-none absolute inset-0 z-[35]">
      {puffs.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: p.x - p.s / 2, top: ANVIL_TOP - 4, width: p.s, height: p.s, background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(220,235,245,0.35) 45%, transparent 70%)' }}
          initial={{ y: 10, scale: 0.3, opacity: 0 }}
          animate={{ y: -p.dy, x: (i % 2 ? 1 : -1) * 18, scale: 2, opacity: [0, 0.95, 0] }}
          transition={{ duration: 1.5, delay: p.d, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- ovládanie

function Gauge({
  zone,
  cfg,
  needle,
  marker,
  lastHit,
  hidden,
}: {
  zone: number
  cfg: { good: number; perfect: number }
  needle: MotionValue<string>
  marker: number | null
  lastHit?: Hit
  hidden: boolean
}) {
  return (
    <div className="relative z-40 mx-4 mt-1">
      <div
        className="relative rounded-xl px-3 py-2.5"
        style={{ background: 'linear-gradient(#55555e, #26262b)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.55)', border: '1px solid #141416' }}
      >
        {/* nity */}
        {[6, 'calc(100% - 10px)'].map((l, i) => (
          <span key={i} className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full" style={{ left: l, background: 'radial-gradient(circle at 35% 35%, #ddd, #555)' }} />
        ))}
        <div className="relative h-6 rounded-md" style={{ background: '#140a06', boxShadow: 'inset 0 2px 6px #000' }}>
          <div className="absolute inset-0 rounded-md opacity-60" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 10%)' }} />
          {!hidden && (
            <>
              <div className="absolute inset-y-0 rounded-sm" style={{ left: `${(zone - cfg.good) * 100}%`, width: `${cfg.good * 200}%`, background: 'linear-gradient(#e8a040, #a85a10)', opacity: 0.75 }} />
              <div className="zone-pulse absolute inset-y-0 rounded-sm" style={{ left: `${(zone - cfg.perfect) * 100}%`, width: `${cfg.perfect * 200}%`, background: 'linear-gradient(#fff6c4, #ffd76a 50%, #e8a020)' }} />
            </>
          )}
          {/* miesto úderu */}
          {marker != null && lastHit != null && (
            <motion.div
              className="absolute -inset-y-1 w-3 -translate-x-1/2 rounded-full"
              style={{ left: `${marker * 100}%`, background: lastHit === 2 ? '#fff6c4' : lastHit === 1 ? '#ffb347' : '#8a6a5a' }}
              initial={{ scale: 2.2, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 0.85 }}
              transition={{ duration: 0.3 }}
            />
          )}
          {/* ručička: žeravá ihla so šípkou */}
          {!hidden && (
            <motion.div className="absolute -inset-y-2 -translate-x-1/2" style={{ left: needle }}>
              <div className="mx-auto h-full w-[3px] rounded-full bg-white" style={{ boxShadow: '0 0 8px #fff, 0 0 14px #ffbf3f' }} />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #fff' }} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function HitText({ h }: { h: Hit }) {
  if (h === 2)
    return (
      <motion.div
        initial={{ scale: 2.2, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 14 }}
        className="font-caps text-3xl leading-none"
        style={{ background: 'linear-gradient(#fffbe0, #ffd76a 45%, #e89a10)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 8px rgba(255,190,60,0.8))' }}
      >
        ✦ Dokonalý úder! ✦
      </motion.div>
    )
  if (h === 1)
    return (
      <motion.div initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} className="font-caps pt-0.5 text-2xl text-[#ffcf8a]">
        Dobrý úder!
      </motion.div>
    )
  return (
    <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: [0, -8, 7, -4, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="font-caps pt-1 text-xl text-[#9a7a68]">
      Vedľa…
    </motion.div>
  )
}

function StrikeToken({ h, active }: { h?: Hit; active: boolean }) {
  const look =
    h === 2
      ? { bg: 'radial-gradient(circle at 35% 30%, #fff6c4, #f5c842 55%, #a8700a)', fg: '#5a3a00', sym: '★', glow: '0 0 14px #ffbf3f' }
      : h === 1
        ? { bg: 'radial-gradient(circle at 35% 30%, #ffd8a8, #d88a3a 55%, #7a4410)', fg: '#3a1e04', sym: '★', glow: '0 0 8px #e89a40' }
        : h === 0
          ? { bg: 'radial-gradient(circle at 35% 30%, #6a5a52, #3a2e28)', fg: '#a89088', sym: '✕', glow: 'none' }
          : { bg: 'radial-gradient(circle at 35% 30%, #4a3a30, #241a14)', fg: '#7a6050', sym: '⚒', glow: active ? '0 0 0 2px #ffbf3f' : 'none' }
  return (
    <motion.div
      key={h ?? 'empty'}
      initial={h != null ? { scale: 0.2, rotate: -120 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
      className="grid h-10 w-10 place-items-center rounded-full text-lg"
      style={{ background: look.bg, color: look.fg, boxShadow: `${look.glow}, inset 0 -2px 4px rgba(0,0,0,0.4)`, border: '1px solid rgba(0,0,0,0.5)' }}
    >
      {look.sym}
    </motion.div>
  )
}
