import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNav } from '../nav'
import { useApp } from '../lib/store'
import { fmt } from '../lib/game'
import { levelFromXp, MAX_LEVEL, REWARDS, xpForLevel } from '../lib/progression'
import { Avatar, Btn, Header, Screen, XpBar } from '../components/ui'

const STEP = 104
const AMP = 70

export function Pass({ initialId }: { initialId?: string }) {
  const nav = useNav()
  const app = useApp()
  const [id, setId] = useState(initialId ?? [...app.profiles].sort((a, b) => b.xp - a.xp)[0]?.id)
  const profile = app.profiles.find((p) => p.id === id)
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 450)
    return () => clearTimeout(t)
  }, [id])

  if (!profile) {
    return (
      <Screen>
        <Header title="Dobrodružstvo" />
        <div className="px-6 py-16 text-center text-muted">
          Najprv si založ profil hráča.
          <Btn variant="accent" className="mt-4 w-full" onClick={() => nav.go({ name: 'profiles' })}>
            Založiť profil
          </Btn>
        </div>
      </Screen>
    )
  }

  const level = levelFromXp(profile.xp)
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)
  const pos = (lvl: number) => ({ x: Math.sin((lvl - 1) * 0.85) * AMP, y: (lvl - 1) * STEP + 84 })
  const width = 360
  const cx = width / 2
  const pathFor = (to: number) =>
    levels
      .filter((l) => l <= to)
      .map((l, i) => {
        const p = pos(l)
        if (i === 0) return `M ${cx + p.x} ${p.y}`
        const prev = pos(l - 1)
        const my = (prev.y + p.y) / 2
        return `C ${cx + prev.x} ${my}, ${cx + p.x} ${my}, ${cx + p.x} ${p.y}`
      })
      .join(' ')

  return (
    <Screen className="safe-bottom">
      <Header title="Dobrodružstvo" />

      {app.profiles.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {app.profiles.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setId(p.id)}
              className={`themed flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 ${p.id === id ? 'glass-strong glow' : 'glass opacity-70'}`}
            >
              <Avatar profile={p} size={30} />
              <span className="text-sm font-medium">{p.name}</span>
            </motion.button>
          ))}
        </div>
      )}

      <div className="px-4">
        <div className="themed glass rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <Avatar profile={profile} size={44} />
            <div className="flex-1">
              <div className="font-semibold">{profile.name}</div>
              <div className="text-xs text-muted">Celkom {fmt(profile.xp)} XP</div>
            </div>
          </div>
          <XpBar xp={profile.xp} className="mt-3" />
        </div>
      </div>

      <motion.div
        key={id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mx-auto mt-4 pb-16"
        style={{ width, height: MAX_LEVEL * STEP + 60 }}
      >
        <svg className="absolute inset-0" width={width} height={MAX_LEVEL * STEP + 60}>
          <path d={pathFor(MAX_LEVEL)} fill="none" stroke="var(--t-border)" strokeWidth={6} strokeDasharray="2 12" strokeLinecap="round" />
          <motion.path
            d={pathFor(level)}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth={6}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 6px var(--t-glow))' }}
          />
        </svg>

        {levels.map((l) => {
          const p = pos(l)
          const reached = l <= level
          const isCurrent = l === level
          const rewards = REWARDS.filter((r) => r.level === l)
          const isNext = l === level + 1 || (l > level && !REWARDS.some((r) => r.level > level && r.level < l))
          const left = p.x < 0
          return (
            <div
              key={l}
              ref={isCurrent ? currentRef : undefined}
              className="absolute"
              style={{ left: cx + p.x, top: p.y, transform: 'translate(-50%, -50%)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: Math.min(l, 10) * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
                className={`themed relative grid h-14 w-14 place-items-center rounded-full text-lg font-black ${reached ? 'btn-accent' : 'glass text-muted'}`}
              >
                {isCurrent ? <span className="text-2xl">{profile.avatar}</span> : l}
                {isCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-accent"
                    animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                  />
                )}
              </motion.div>

              {rewards.length > 0 && (
                <div
                  className={`absolute top-1/2 flex w-36 -translate-y-1/2 flex-col gap-1 ${left ? 'left-[68px]' : 'right-[68px] items-end'}`}
                >
                  {rewards.map((r) => (
                    <motion.div
                      key={r.kind + r.id}
                      initial={{ opacity: 0, x: left ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + Math.min(l, 10) * 0.04 }}
                      className={`themed flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 ${reached ? 'glass-strong' : 'glass'} ${left ? '' : 'flex-row-reverse text-right'}`}
                    >
                      <span className="relative text-2xl">
                        <span style={reached ? undefined : { filter: 'brightness(0)', opacity: 0.5 }}>{r.icon}</span>
                        {!reached && <span className="absolute inset-0 grid place-items-center text-sm font-black text-ink">?</span>}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">{reached ? r.name : isNext ? 'Ďalšia odmena' : '???'}</div>
                        <div className="truncate text-[10px] text-muted">
                          {reached ? 'Odomknuté ✓' : `${fmt(Math.max(0, xpForLevel(l) - profile.xp))} XP`}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </motion.div>
    </Screen>
  )
}
