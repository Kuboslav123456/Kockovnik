import { motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { useNav } from '../nav'
import { forgeCustom, updateProfile, useApp } from '../lib/store'
import {
  buildDie, DEFAULT_SPEC, emblemFor, EMBLEMS, FORGE_EFFECTS, FORGE_SLOTS, forgeCost, MATERIAL_MAP, MATERIALS, PIP_COLORS, PIP_STYLES, QUALITY,
  randomDieName, unlocked,
} from '../lib/forge'
import { fmt } from '../lib/game'
import { sfx } from '../lib/sound'
import type { CustomDie, EmblemKind, ForgeEffect, ForgeSpec, PipStyle, Profile } from '../lib/types'
import { Avatar, Btn, Header, Screen, Section } from '../components/ui'
import { Die3D } from '../components/Die3D'
import { ForgeGame } from '../components/ForgeGame'
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
        <ForgeGame
          die={preview}
          quenching={stage === 'quench'}
          onStrikesDone={(quality) => {
            setStage('quench')
            // kocka skočí do vedra, zasyčí a vynorí sa (≈ 2,3 s)
            setTimeout(() => {
              const die = forgeCustom(profile.id, spec, name, quality)
              setMade(die)
              setStage('done')
              if (die) sfx.levelUp()
            }, 2400)
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
