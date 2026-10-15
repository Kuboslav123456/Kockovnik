import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNav } from '../nav'
import { forgeCustom, updateProfile, useApp } from '../lib/store'
import {
  buildDie, DEFAULT_SPEC, emblemFor, EMBLEMS, FORGE_EFFECTS, FORGE_SLOTS, forgeCost, MATERIAL_MAP, MATERIALS, PIP_COLORS, PIP_STYLES, QUALITY,
  randomDieName, unlocked,
} from '../lib/forge'
import { fmt } from '../lib/game'
import { sfx } from '../lib/sound'
import type { CustomDie, EmblemKind, ForgeEffect, ForgeQuality, ForgeSpec, PipStyle, Profile } from '../lib/types'
import { Avatar, Btn, Header, Screen, Section } from '../components/ui'
import { Die3D } from '../components/Die3D'
import type { DieDef } from '../lib/dice'

type Stage = 'design' | 'hammer' | 'quench' | 'done'

export function Forge({ initialId }: { initialId?: string }) {
  const nav = useNav()
  const app = useApp()
  const [id, setId] = useState(initialId ?? [...app.profiles].sort((a, b) => b.xp - a.xp)[0]?.id)
  const profile = app.profiles.find((p) => p.id === id)
  const [spec, setSpec] = useState<ForgeSpec>(DEFAULT_SPEC)
  const [name, setName] = useState(() => randomDieName())
  const [stage, setStage] = useState<Stage>('design')
  const [made, setMade] = useState<CustomDie | null>(null)

  if (!profile) {
    return (
      <Screen>
        <Header title="Kováreň" />
        <div className="px-6 py-16 text-center text-muted">
          Najprv si založ hráča. Kocky sa kujú za mince z truhlíc.
          <Btn variant="accent" className="mt-4 w-full" onClick={() => nav.go({ name: 'profiles' })}>
            Založiť hráča
          </Btn>
        </div>
      </Screen>
    )
  }

  const preview = buildDie({ ...spec, name, emblemText: emblemFor(spec.emblem, profile) })

  if (stage === 'hammer' || stage === 'quench') {
    return (
      <Screen>
        <Header title="Kováreň" onBack={() => setStage('design')} />
        <HammerGame
          die={preview}
          quenching={stage === 'quench'}
          onStrikesDone={(quality) => {
            setStage('quench')
            sfx.hiss()
            setTimeout(() => {
              const die = forgeCustom(profile.id, spec, name, quality)
              setMade(die)
              setStage('done')
              if (die) sfx.levelUp()
            }, 1700)
          }}
        />
      </Screen>
    )
  }

  if (stage === 'done') {
    return (
      <Screen className="safe-bottom pb-8">
        <Header title="Kováreň" onBack={() => setStage('design')} />
        <Reveal
          die={made}
          profile={profile}
          onAgain={() => {
            setName(randomDieName(name))
            setStage('design')
          }}
          onTreasury={() => nav.go({ name: 'treasury', id: profile.id })}
        />
      </Screen>
    )
  }

  return (
    <Screen className="pb-36">
      <Header title="Kováreň" right={<span className="tabular shrink-0 text-sm text-muted">🪙 {fmt(profile.coins)}</span>} />

      {app.profiles.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {app.profiles.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                sfx.tap()
                setId(p.id)
              }}
              className={`themed flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 ${p.id === id ? 'glass-strong glow' : 'glass opacity-70'}`}
            >
              <Avatar profile={p} size={30} />
              <span className="text-sm">{p.name}</span>
            </motion.button>
          ))}
        </div>
      )}

      <Designer profile={profile} spec={spec} setSpec={setSpec} name={name} setName={setName} preview={preview} />

      <ForgeBar profile={profile} spec={spec} onForge={() => setStage('hammer')} />
    </Screen>
  )
}

// ---------------------------------------------------------------- návrh

function Designer({
  profile,
  spec,
  setSpec,
  name,
  setName,
  preview,
}: {
  profile: Profile
  spec: ForgeSpec
  setSpec: (s: ForgeSpec) => void
  name: string
  setName: (n: string) => void
  preview: DieDef
}) {
  const material = MATERIAL_MAP[spec.material]
  const set = (patch: Partial<ForgeSpec>) => {
    sfx.tap()
    setSpec({ ...spec, ...patch })
  }

  return (
    <>
      <Section>
        <div className="themed glass relative flex flex-col items-center overflow-hidden px-4 pb-4 pt-5">
          {/* žiara výhne */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3" style={{ background: 'radial-gradient(60% 70% at 50% 100%, rgba(255,120,30,0.28), transparent 70%)' }} />
          <div className="relative grid h-36 place-items-center">
            <Die3D die={preview} size={92} idle interactive />
          </div>
          <div className="relative mt-2 flex w-full items-center gap-2">
            <input
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              className="font-display min-w-0 flex-1 border-b border-line bg-transparent pb-1 text-center text-2xl outline-none"
              aria-label="Meno kocky"
            />
            <button
              className="grid h-10 w-10 shrink-0 place-items-center text-xl"
              aria-label="Iné meno"
              onClick={() => {
                sfx.dice()
                setName(randomDieName(name))
              }}
            >
              🎲
            </button>
          </div>
          <div className="relative mt-1 text-xs text-muted">
            Otoč kockou prstom · miesta v kovárni {(profile.custom ?? []).length}/{FORGE_SLOTS}
          </div>
        </div>
      </Section>

      <Section title="1 · Materiál" className="mt-5">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {MATERIALS.map((m) => {
            const open = unlocked(profile, m.level)
            return (
              <Opt
                key={m.id}
                selected={spec.material === m.id}
                locked={!open}
                onClick={() => set({ material: m.id, tint: m.tints[0].id })}
                className="w-[86px] shrink-0"
              >
                <span className="text-2xl">{m.icon}</span>
                <span className="text-sm">{m.name}</span>
                <Price open={open} level={m.level} cost={m.cost} />
              </Opt>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 px-1">
          {material.tints.map((t) => (
            <button key={t.id} onClick={() => set({ tint: t.id })} className="flex flex-col items-center gap-1" aria-label={t.name}>
              <span
                className="block h-10 w-10 rounded-xl"
                style={{
                  background: t.face,
                  border: `1px solid ${t.edge}`,
                  boxShadow: spec.tint === t.id ? '0 0 0 2px var(--t-bg, transparent), 0 0 0 4px var(--t-accent)' : undefined,
                }}
              />
              <span className={`text-[11px] ${spec.tint === t.id ? 'text-accent' : 'text-muted'}`}>{t.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="2 · Oká" className="mt-5">
        <div className="flex flex-wrap gap-2.5 px-1">
          {PIP_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => set({ pipColor: c.id })}
              aria-label={c.name}
              className="h-8 w-8 rounded-full"
              style={{
                background: c.color,
                border: '1px solid rgba(0,0,0,0.25)',
                boxShadow: spec.pipColor === c.id ? '0 0 0 2px var(--t-accent)' : 'inset 0 2px 3px rgba(0,0,0,0.25)',
              }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(Object.keys(PIP_STYLES) as PipStyle[]).map((k) => {
            const o = PIP_STYLES[k]
            const open = unlocked(profile, o.level)
            return (
              <Opt key={k} selected={spec.pipStyle === k} locked={!open} onClick={() => set({ pipStyle: k })}>
                <span className="font-display text-xl leading-none">{o.icon}</span>
                <span className="text-[11px] leading-tight">{o.name}</span>
                <Price open={open} level={o.level} cost={o.cost} />
              </Opt>
            )
          })}
        </div>
      </Section>

      <Section title="3 · Erb na jednotke" className="mt-5">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EMBLEMS) as EmblemKind[]).map((k) => {
            const o = EMBLEMS[k]
            const open = unlocked(profile, o.level)
            return (
              <Opt key={k} selected={spec.emblem === k} locked={!open} onClick={() => set({ emblem: k })}>
                <span className="font-display text-xl leading-none">{k === 'none' ? '⚀' : emblemFor(k, profile)}</span>
                <span className="text-[11px]">{o.name}</span>
                <Price open={open} level={o.level} cost={o.cost} />
              </Opt>
            )
          })}
        </div>
      </Section>

      <Section title="4 · Efekt" className="mt-5">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FORGE_EFFECTS) as ForgeEffect[]).map((k) => {
            const o = FORGE_EFFECTS[k]
            const open = unlocked(profile, o.level)
            return (
              <Opt key={k} selected={spec.effect === k} locked={!open} onClick={() => set({ effect: k })}>
                <span className="text-xl leading-none">{o.icon}</span>
                <span className="text-[11px] leading-tight">{o.name}</span>
                <Price open={open} level={o.level} cost={o.cost} />
              </Opt>
            )
          })}
        </div>
      </Section>
    </>
  )
}

function Opt({ selected, locked, onClick, children, className = '' }: { selected: boolean; locked: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button
      whileTap={locked ? undefined : { scale: 0.93 }}
      disabled={locked}
      onClick={onClick}
      className={`themed flex flex-col items-center gap-1 px-1 py-2.5 ${selected ? 'glass-strong glow' : 'glass'} ${locked ? 'opacity-45' : ''} ${className}`}
    >
      {children}
    </motion.button>
  )
}

function Price({ open, level, cost }: { open: boolean; level: number; cost: number }) {
  if (!open) return <span className="text-[10px] text-muted">🔒 úr. {level}</span>
  return <span className="text-[10px] text-muted">{cost ? `${cost} 🪙` : 'zadarmo'}</span>
}

function ForgeBar({ profile, spec, onForge }: { profile: Profile; spec: ForgeSpec; onForge: () => void }) {
  const cost = forgeCost(spec)
  const full = (profile.custom ?? []).length >= FORGE_SLOTS
  const missing = cost - profile.coins
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pt-8" style={{ background: 'linear-gradient(to top, var(--t-sheet) 55%, transparent)' }}>
      <div className="mb-1.5 flex items-baseline justify-between px-1 text-sm">
        <span className="text-muted">Cena kovania</span>
        <span className="tabular">
          <b className="text-lg text-accent">{fmt(cost)}</b> 🪙 <span className="text-muted">/ máš {fmt(profile.coins)}</span>
        </span>
      </div>
      <Btn variant="accent" className="w-full py-4 text-lg" disabled={full || missing > 0} onClick={onForge}>
        {full ? `Kováreň je plná (${FORGE_SLOTS}/${FORGE_SLOTS})` : missing > 0 ? `Chýba ${fmt(missing)} 🪙` : '⚒ Rozžeraviť výheň a kovať'}
      </Btn>
      {full && <p className="mt-1.5 text-center text-xs text-muted">V Klenotnici niektorú vlastnú kocku rozbi a uvoľníš miesto.</p>}
    </div>
  )
}

// ---------------------------------------------------------------- minihra

/** šírka zón a rýchlosť ručičky pre 1., 2. a 3. úder */
const STRIKES = [
  { sweep: 1100, good: 0.12, perfect: 0.045 },
  { sweep: 850, good: 0.1, perfect: 0.038 },
  { sweep: 800, good: 0.085, perfect: 0.032 },
]

const HIT_TEXT = ['Vedľa…', 'Dobrý úder!', 'Dokonalý úder!']

export function scoreToQuality(total: number): ForgeQuality {
  return total >= 5 ? 'master' : total >= 3 ? 'journeyman' : 'apprentice'
}

function HammerGame({ die, quenching, onStrikesDone }: { die: DieDef; quenching: boolean; onStrikesDone: (q: ForgeQuality) => void }) {
  const [strike, setStrike] = useState(0)
  const [hits, setHits] = useState<(0 | 1 | 2)[]>([])
  const [paused, setPaused] = useState(false)
  const zone = useMemo(() => 0.2 + Math.random() * 0.6, [strike]) // eslint-disable-line react-hooks/exhaustive-deps
  const pos = useMotionValue(0)
  const t = useRef(0)
  const left = useTransform(pos, (v) => `${v * 100}%`)
  const cfg = STRIKES[Math.min(strike, STRIKES.length - 1)]
  const done = hits.length >= STRIKES.length

  // ručička behá tam a späť; počas vyhodnotenia úderu stojí
  useAnimationFrame((_, dt) => {
    if (paused || done) return
    t.current += dt
    const c = (t.current % (cfg.sweep * 2)) / cfg.sweep
    pos.set(c <= 1 ? c : 2 - c)
  })

  const hit = () => {
    if (paused || done) return
    const d = Math.abs(pos.get() - zone)
    const h: 0 | 1 | 2 = d <= cfg.perfect ? 2 : d <= cfg.good ? 1 : 0
    sfx.clang(h)
    const next = [...hits, h]
    setHits(next)
    setPaused(true)
    setTimeout(() => {
      if (next.length >= STRIKES.length) {
        onStrikesDone(scoreToQuality(next.reduce<number>((a, x) => a + x, 0)))
        return
      }
      t.current = 0
      setStrike((s) => s + 1)
      setPaused(false)
    }, 750)
  }

  const last = hits[hits.length - 1]

  return (
    <div className="px-4" onPointerDown={(e) => (e.target as HTMLElement).closest('button') || hit()}>
      <div className="relative overflow-hidden rounded-3xl px-4 pb-6 pt-8" style={{ background: 'radial-gradient(90% 70% at 50% 80%, #6a2a0c 0%, #2a1208 55%, #120804 100%)' }}>
        {/* výheň */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'radial-gradient(50% 60% at 50% 100%, rgba(255,140,30,0.45), transparent 70%)' }} />

        <div className="relative mx-auto grid h-48 w-56 place-items-center">
          {/* kladivo */}
          <motion.div
            key={`h${hits.length}`}
            className="absolute right-2 top-0 origin-bottom-right text-6xl"
            initial={{ rotate: hits.length ? 25 : -35 }}
            animate={{ rotate: -35 }}
            transition={{ type: 'spring', stiffness: 260, damping: 12 }}
            style={{ transformOrigin: '80% 80%' }}
          >
            🔨
          </motion.div>
          {/* rozžeravená kocka – pri kalení vychladne */}
          <motion.div
            key={`d${hits.length}`}
            initial={hits.length ? { scaleY: 0.82, scaleX: 1.1 } : false}
            animate={{ scaleY: 1, scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            className="relative mt-6"
          >
            <div
              className="absolute rounded-full transition-opacity duration-[1500ms]"
              style={{ inset: -40, background: 'radial-gradient(circle, rgba(255,170,60,0.9), rgba(255,80,0,0.4) 45%, transparent 70%)', opacity: quenching ? 0 : 1 }}
            />
            <div className="transition-[filter] duration-[1500ms]" style={{ filter: quenching ? 'none' : 'sepia(1) saturate(6) hue-rotate(-18deg) brightness(1.3)' }}>
              <Die3D die={die} size={70} />
            </div>
          </motion.div>
          {/* nákova */}
          <div
            className="relative -mt-1 h-10 w-44"
            style={{ background: 'linear-gradient(#5a5a62, #2a2a30)', clipPath: 'polygon(0 0, 100% 0, 88% 45%, 70% 55%, 74% 100%, 26% 100%, 30% 55%, 12% 45%)' }}
          />
          {/* iskry po údere */}
          {last != null && last > 0 && <Sparks key={`s${hits.length}`} big={last === 2} />}
          {quenching && <Steam />}
        </div>

        <div className="relative mt-4 h-6 text-center">
          {quenching ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-caps text-lg text-[#ffe0b0]">
              Kalenie… sssss
            </motion.span>
          ) : paused && last != null ? (
            <motion.span key={hits.length} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-caps text-lg" style={{ color: last === 2 ? '#ffd76a' : last === 1 ? '#ffe0b0' : '#b08a70' }}>
              {HIT_TEXT[last]}
            </motion.span>
          ) : (
            <span className="text-sm text-[#d8b898]">Udri, keď je ručička v zlatom poli</span>
          )}
        </div>

        {/* stupnica */}
        <div className="relative mx-1 mt-3 h-7 rounded-full" style={{ background: 'linear-gradient(90deg, #3a1a0c, #5a2a10 50%, #3a1a0c)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)' }}>
          {!done && (
            <>
              <div className="absolute inset-y-0 rounded-full" style={{ left: `${(zone - cfg.good) * 100}%`, width: `${cfg.good * 200}%`, background: 'rgba(255,190,80,0.45)' }} />
              <div className="absolute inset-y-0 rounded-full" style={{ left: `${(zone - cfg.perfect) * 100}%`, width: `${cfg.perfect * 200}%`, background: '#ffd76a', boxShadow: '0 0 12px #ffbf3f' }} />
            </>
          )}
          <motion.div className="absolute -inset-y-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white" style={{ left, boxShadow: '0 0 8px #fff' }} />
        </div>

        <div className="relative mt-4 flex justify-center gap-3 text-2xl">
          {STRIKES.map((_, i) => (
            <span key={i} style={{ color: hits[i] === 2 ? '#ffd76a' : hits[i] === 1 ? '#e8b070' : hits[i] === 0 ? '#6a4a3a' : '#4a3020' }}>
              {hits[i] === undefined ? '○' : hits[i] === 0 ? '✕' : '★'}
            </span>
          ))}
        </div>
      </div>

      <Btn variant="accent" className="mt-4 w-full py-5 text-xl" silent disabled={paused || done} onClick={hit}>
        🔨 Udrieť
      </Btn>
      <p className="mt-2 text-center text-xs text-muted">Tri údery: zlaté pole = dobrý, svetlý stred = dokonalý. Ručička je zakaždým rýchlejšia.</p>
    </div>
  )
}

function Sparks({ big }: { big: boolean }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: big ? 16 : 9 }, () => {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3
        const r = 50 + Math.random() * (big ? 90 : 55)
        return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 3 + Math.random() * 3 }
      }),
    [big],
  )
  return (
    <div className="pointer-events-none absolute left-1/2 top-[58%]">
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: s.s, height: s.s, background: '#fff3c4', boxShadow: '0 0 6px #ffae3f' }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: s.x, y: s.y + 30, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function Steam() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3">
      {Array.from({ length: 8 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${25 + (i % 4) * 16}%`, width: 46, height: 46, background: 'radial-gradient(circle, rgba(255,255,255,0.75), transparent 70%)' }}
          initial={{ y: 30, scale: 0.4, opacity: 0 }}
          animate={{ y: -90 - (i % 3) * 20, scale: 1.8, opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.5, delay: i * 0.08, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- odhalenie

function Reveal({ die, profile, onAgain, onTreasury }: { die: CustomDie | null; profile: Profile; onAgain: () => void; onTreasury: () => void }) {
  const isFav = die && profile.favoriteDie === die.id
  useEffect(() => {
    if (!die) sfx.error()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!die) {
    return <div className="px-6 py-16 text-center text-muted">Kovanie sa nepodarilo – chýbajú mince alebo voľné miesto.</div>
  }
  const q = QUALITY[die.quality]
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }} className="relative mt-4 grid h-48 w-48 place-items-center">
        <div className="spin-slow absolute inset-0 rounded-full opacity-70" style={{ background: 'repeating-conic-gradient(var(--t-glow) 0 10deg, transparent 10deg 22deg)', maskImage: 'radial-gradient(circle, black 25%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 70%)' }} />
        <Die3D die={buildDie(die)} size={100} idle interactive />
      </motion.div>
      <motion.h2 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="font-display mt-4 text-4xl leading-tight">
        {die.name}
      </motion.h2>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-2">
        <div className="text-2xl tracking-widest" style={{ color: '#d4a017' }}>
          {'★'.repeat(q.stars)}
          <span className="opacity-30">{'★'.repeat(3 - q.stars)}</span>
        </div>
        <div className="font-caps mt-1 text-lg text-accent">{q.name} práca</div>
        <p className="mt-1 text-sm italic text-muted">{q.desc}</p>
      </motion.div>

      <div className="mt-6 flex w-full flex-col gap-2">
        <Btn variant={isFav ? 'glass' : 'accent'} className="w-full py-4 text-lg" disabled={!!isFav} onClick={() => updateProfile(profile.id, { favoriteDie: die.id })}>
          {isFav ? '★ Je to tvoja obľúbená kocka' : '★ Nastaviť ako obľúbenú'}
        </Btn>
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={onTreasury}>💎 Klenotnica</Btn>
          <Btn onClick={onAgain}>⚒ Kovať ďalšiu</Btn>
        </div>
      </div>
    </div>
  )
}
