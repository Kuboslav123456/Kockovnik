import { animate, AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNav } from '../nav'
import { startGame, useApp } from '../lib/store'
import { deriveGame, fmt, nextStartOrder } from '../lib/game'
import { ACHIEVEMENT_MAP, cosmetics, KIND_LABEL, levelFromXp, levelProgress, REWARDS, type Reward } from '../lib/progression'
import { playEffect, wasEffectPlayed } from '../lib/effects'
import { sfx } from '../lib/sound'
import { THEMES } from '../lib/themes'
import type { ChestResult, GameResult, PlayerResult, Profile } from '../lib/types'
import { CHESTS, DICE_SETS, DIE_MAP, RARITIES } from '../lib/dice'
import { Die3D } from '../components/Die3D'
import { Avatar, Btn, PlayerName } from '../components/ui'

export function Victory() {
  const nav = useNav()
  const app = useApp()
  const result = app.lastResult

  // presmerovať smie len aktívna obrazovka – odchádzajúca (počas animácie) nie
  useEffect(() => {
    if (!result && nav.route.name === 'victory') nav.reset({ name: 'home' })
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) return null
  return <VictoryView result={result} profiles={app.profiles} />
}

function VictoryView({ result, profiles }: { result: GameResult; profiles: Profile[] }) {
  const nav = useNav()
  const [phase, setPhase] = useState<'celebrate' | 'rewards'>('celebrate')
  const { game } = result
  const d = deriveGame(game)
  const byId = (id: string) => profiles.find((p) => p.id === id)
  const winner = byId(game.winnerId)
  const played = useRef(false)

  useEffect(() => {
    if (played.current || !winner) return
    played.current = true
    if (wasEffectPlayed(game.id)) return
    const c = cosmetics(winner)
    const t = THEMES[c.themeId].vars
    playEffect(c.effectId, [t['--t-accent'], t['--t-accent2'], t['--t-accent3']])
  }, [winner])

  const best = game.turns.reduce((a, t) => (t.points > a.points ? t : a), { playerId: '', points: 0 })
  const rounds = Math.ceil(game.turns.length / game.playerIds.length)
  const minutes = Math.max(1, Math.round((game.finishedAt - game.startedAt) / 60000))

  const rematch = () => {
    startGame(nextStartOrder(game.playerIds), game.target, game.rules)
    nav.reset({ name: 'game' })
  }

  // Výsledky zoradené: víťaz prvý
  const ordered = [...result.players].sort((a, b) => d.ranking.indexOf(a.playerId) - d.ranking.indexOf(b.playerId))

  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-full w-full max-w-md flex-col px-4">
      {phase === 'celebrate' ? (
          <motion.div key="c" className="flex flex-1 flex-col">
            <div className="relative mt-6 flex flex-col items-center text-center">
              <motion.div
                className="absolute top-0 h-64 w-64 rounded-full opacity-60"
                style={{ background: 'repeating-conic-gradient(var(--t-glow) 0 10deg, transparent 10deg 20deg)', maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }} className="relative mt-10">
                {winner && <Avatar profile={winner} size={120} glow />}
                <motion.div className="absolute -right-4 -top-6 text-5xl" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, type: 'spring' }}>
                  👑
                </motion.div>
              </motion.div>
              <motion.h1 className="font-display text-glow relative mt-6 text-[40px] leading-tight" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}>
                {winner?.name ?? '?'} vyhráva!
              </motion.h1>
              <motion.div className="tabular relative mt-1 text-lg text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                {fmt(d.totals[game.winnerId])} bodov · cieľ {fmt(game.target)}
              </motion.div>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              {d.ranking.map((id, i) => {
                const p = byId(id)
                if (!p) return null
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.12, type: 'spring', stiffness: 260, damping: 24 }}
                    className={`themed flex items-center gap-3 rounded-2xl px-3 py-2.5 ${i === 0 ? 'glass-strong glow' : 'glass'}`}
                  >
                    <span className="w-6 text-center text-lg font-bold text-muted">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                    <Avatar profile={p} size={36} />
                    <PlayerName profile={p} className="flex-1" />
                    <span className="tabular text-xl font-black">{fmt(d.totals[id])}</span>
                  </motion.div>
                )
              })}
            </div>

            <motion.div className="mt-4 grid grid-cols-3 gap-2 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
              <Stat label="Kôl" value={String(rounds)} />
              <Stat label="Najlepší ťah" value={best.points ? `${byId(best.playerId)?.avatar ?? ''} ${fmt(best.points)}` : '–'} />
              <Stat label="Trvanie" value={`${minutes} min`} />
            </motion.div>

            <div className="mt-auto pt-6">
              <Btn variant="accent" className="w-full !rounded-3xl py-5 text-xl" onClick={() => setPhase('rewards')}>
                Odmeny a XP ✨
              </Btn>
            </div>
          </motion.div>
        ) : (
          <motion.div key="r" className="flex flex-1 flex-col" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-caps mb-4 mt-2 text-center text-3xl tracking-wide">Dobrodružstvo</h1>
            <div className="flex flex-col gap-3">
              {ordered.map((r, i) => {
                const p = byId(r.playerId)
                return p ? <RewardCard key={r.playerId} result={r} profile={p} delay={0.3 + i * 0.9} /> : null
              })}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
              <Btn className="py-4" onClick={() => nav.reset({ name: 'home' })}>
                Domov
              </Btn>
              <Btn variant="accent" className="py-4 text-lg" onClick={rematch}>
                🔁 Odveta
              </Btn>
            </div>
          </motion.div>
        )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="themed glass rounded-2xl px-2 py-3">
      <div className="tabular truncate font-bold">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}

/** Karta hráča: XP sa animovane pripočíta, pri novej úrovni sa karta zatrasie a ukážu sa odmeny. */
function RewardCard({ result, profile, delay }: { result: PlayerResult; profile: Profile; delay: number }) {
  const [xp, setXp] = useState(result.xpBefore)
  const [done, setDone] = useState(false)
  const card = useAnimationControls()
  const lastLevel = useRef(levelFromXp(result.xpBefore))
  const p = levelProgress(xp)
  const gained = result.xpAfter - result.xpBefore
  const startLevel = levelFromXp(result.xpBefore)
  const endLevel = levelFromXp(result.xpAfter)
  const newRewards = REWARDS.filter((r) => r.level > startLevel && r.level <= endLevel)

  useEffect(() => {
    const c = animate(result.xpBefore, result.xpAfter, {
      delay,
      duration: 1.4 + Math.min(1.5, (endLevel - startLevel) * 0.5),
      ease: [0.3, 0, 0.2, 1],
      onUpdate: (v) => {
        setXp(v)
        const lvl = levelFromXp(v)
        if (lvl > lastLevel.current) {
          lastLevel.current = lvl
          sfx.levelUp()
          void card.start({ x: [0, -8, 8, -6, 6, -3, 3, 0], scale: [1, 1.04, 1], transition: { duration: 0.55 } })
        }
      },
      onComplete: () => setDone(true),
    })
    return () => c.stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const leveled = p.level > startLevel

  return (
    <motion.div
      animate={card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className={`themed relative overflow-hidden rounded-3xl p-4 ${leveled ? 'glass-strong glow' : 'glass'}`}
    >
      {leveled && <div className="shimmer pointer-events-none absolute inset-0 opacity-30" />}
      <div className="relative flex items-center gap-3">
        <Avatar profile={{ avatar: profile.avatar, xp }} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{profile.name}</div>
          <div className="text-xs text-muted">{result.lines.some((l) => l.label === 'Výhra') ? '⭐ Víťaz + 1 hviezda' : 'Účasť sa cení'}</div>
        </div>
        <div className="text-right">
          <AnimatePresence mode="popLayout">
            <motion.div key={p.level} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`text-2xl font-black ${leveled ? 'text-accent text-glow' : ''}`}>
              {p.level}
            </motion.div>
          </AnimatePresence>
          <div className="text-[10px] uppercase tracking-wider text-muted">úroveň</div>
        </div>
      </div>

      <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-track">
        <div className="bar-fill h-full rounded-full" style={{ width: `${Math.max(2, p.ratio * 100)}%` }} />
      </div>
      <div className="relative mt-1 flex justify-between text-xs text-muted">
        <span className="tabular">+{gained} XP</span>
        <span className="tabular">{p.needed ? `${Math.round(p.current)} / ${p.needed}` : 'MAX'}</span>
      </div>

      <div className="relative mt-2 flex flex-wrap gap-1.5">
        {result.lines.map((l, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + i * 0.15 }}
            className="rounded-full bg-surface-strong px-2.5 py-1 text-[11px]"
          >
            {l.label} <b className="text-accent">+{l.xp}</b>
          </motion.span>
        ))}
      </div>

      <AnimatePresence>
        {done && (result.newAchievements.length > 0 || newRewards.length > 0) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative overflow-hidden">
            {newRewards.length > 0 && (
              <>
                <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-accent">Odomknuté – ťukni na kartu</div>
                <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                  {newRewards.map((r, i) => (
                    <FlipCard key={r.level + r.kind + r.id} reward={r} delay={i * 0.15} />
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  Klávesnica, animácie, písmo a zvuky sa zapnú samé. Novú tému stola si vyber v profile. Všetko uvidia ostatní počas tvojho ťahu.
                </div>
              </>
            )}
            {result.newAchievements.length > 0 && (
              <>
                <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-accent">Nové odznaky</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.newAchievements.map((id, i) => {
                    const a = ACHIEVEMENT_MAP[id]
                    return (
                      <motion.div
                        key={id}
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.2 + i * 0.2 }}
                        className="themed glass-strong flex items-center gap-2 rounded-2xl px-3 py-2"
                      >
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <div className="text-sm font-semibold">{a.name}</div>
                          <div className="text-[11px] text-muted">{a.desc}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {done && result.chest && <ChestOpen chest={result.chest} />}
    </motion.div>
  )
}

const CHEST_LOOK: Record<ChestResult['tier'], { body: string; lid: string; strap: string; border: string }> = {
  wood: { body: 'linear-gradient(180deg,#9a6534,#6b4220)', lid: 'linear-gradient(180deg,#b07440,#7d4e26)', strap: '#3b2a1a', border: '#4a2c12' },
  iron: { body: 'linear-gradient(180deg,#9aa0a8,#5b6068)', lid: 'linear-gradient(180deg,#b4bac2,#6e747c)', strap: '#33363b', border: '#2a2c30' },
  gold: { body: 'linear-gradient(180deg,#f5c842,#b07d0a)', lid: 'linear-gradient(180deg,#ffe27a,#d29a12)', strap: '#7a1a10', border: '#7a5200' },
}

/** Truhlica po hre: ťuknutím sa zatrasie, otvorí a vyletí z nej kocka do Klenotnice. */
function ChestOpen({ chest }: { chest: ChestResult }) {
  const [phase, setPhase] = useState<'closed' | 'shaking' | 'open'>('closed')
  const die = DIE_MAP[chest.dieId]
  const rarity = RARITIES[die.rarity]
  const look = CHEST_LOOK[chest.tier]
  const shake = useAnimationControls()

  const open = async () => {
    if (phase !== 'closed') return
    setPhase('shaking')
    sfx.dice()
    await shake.start({ rotate: [0, -7, 7, -9, 9, -5, 4, 0], y: [0, -2, 0, -3, 0, -1, 0], transition: { duration: 0.75 } })
    setPhase('open')
    sfx.seal()
    if (die.rarity === 'common') sfx.add(300)
    else if (die.rarity === 'rare') sfx.add(1000)
    else sfx.levelUp()
  }

  return (
    <div className="relative mt-4 border-t border-rule pt-3">
      <div className="font-caps text-sm text-accent">{CHESTS[chest.tier].name}</div>
      <div className="mt-6 flex items-center gap-4">
        <motion.button
          animate={shake}
          onClick={open}
          whileTap={phase === 'closed' ? { scale: 0.93 } : undefined}
          className="relative h-[86px] w-[92px] shrink-0"
          aria-label="Otvoriť truhlicu"
        >
          {/* svetlo z truhlice */}
          {phase === 'open' && (
            <motion.div
              className="absolute left-1/2 top-6 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle, ${die.glow ?? rarity.color}, transparent 65%)` }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 0.9, 0.55], scale: [0.3, 1.3, 1.1] }}
              transition={{ duration: 0.9 }}
            />
          )}
          {/* kocka vyletí z truhlice */}
          {phase === 'open' && (
            <motion.div
              className="absolute left-1/2 top-2 z-10 -translate-x-1/2"
              initial={{ y: 40, scale: 0.2, opacity: 0 }}
              animate={{ y: -30, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            >
              <Die3D die={die} size={38} idle speed={2} />
            </motion.div>
          )}
          {/* telo */}
          <div className="absolute inset-x-1 bottom-0 h-[46px]" style={{ background: look.body, border: `2px solid ${look.border}`, borderRadius: 4 }}>
            <div className="absolute inset-y-0 left-3 w-2" style={{ background: look.strap }} />
            <div className="absolute inset-y-0 right-3 w-2" style={{ background: look.strap }} />
          </div>
          {/* veko */}
          <motion.div
            className="absolute inset-x-0 bottom-[42px] h-[26px]"
            style={{ background: look.lid, border: `2px solid ${look.border}`, borderRadius: '14px 14px 3px 3px', transformOrigin: '8% 100%' }}
            animate={phase === 'open' ? { rotate: -38, y: -6, x: -6 } : { rotate: 0, y: 0, x: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          >
            <div className="absolute inset-y-0 left-3 w-2" style={{ background: look.strap }} />
            <div className="absolute inset-y-0 right-3 w-2" style={{ background: look.strap }} />
          </motion.div>
          {/* zámok */}
          <div className="absolute bottom-[30px] left-1/2 h-4 w-3.5 -translate-x-1/2 rounded-sm" style={{ background: '#e9c66a', border: `1px solid ${look.border}` }} />
        </motion.button>

        <div className="min-w-0 flex-1 text-left">
          {phase !== 'open' ? (
            <div className="italic text-muted">{phase === 'closed' ? 'Ťukni na truhlicu a otvor ju…' : 'Niečo v nej hrká…'}</div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <div className="font-caps text-xs" style={{ color: rarity.color }}>
                {rarity.name} kocka
              </div>
              <div className="text-lg leading-tight">{die.name}</div>
              <div className="mt-1 text-xs text-muted">
                {chest.isNew ? '✦ Nová do Klenotnice!' : `Duplikát → +${RARITIES[die.rarity].coins} 🪙`} · truhlica +{CHESTS[chest.tier].coins} 🪙
              </div>
              {(chest.completedSets ?? []).map((id) => {
                const set = DICE_SETS.find((s) => s.id === id)!
                return (
                  <motion.div
                    key={id}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 260, damping: 12 }}
                    className="mt-1.5 text-sm text-accent"
                  >
                    {set.icon} Sada „{set.name}“ dokončená! Titul „{set.titleName}“ +{set.coins} 🪙
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Zberateľská karta – rubom hore, po ťuknutí sa otočí. */
function FlipCard({ reward, delay }: { reward: Reward; delay: number }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <motion.button
      initial={{ y: 30, opacity: 0, rotate: -6 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
      onClick={() => {
        if (flipped) return
        sfx.flip()
        setFlipped(true)
      }}
      className="relative h-40 w-28 shrink-0"
      style={{ perspective: 800 }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      >
        {/* rub */}
        <div
          className="btn-accent absolute inset-0 grid place-items-center rounded-2xl"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-2 rounded-xl border-2 border-dashed border-black/25" />
          <motion.span className="text-4xl" animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>
            🎲
          </motion.span>
          <div className="shimmer absolute inset-0 rounded-2xl" />
        </div>
        {/* líce */}
        <div
          className="themed glass-strong glow absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-[9px] font-semibold uppercase tracking-wider text-accent">{KIND_LABEL[reward.kind]}</span>
          <span className="text-4xl">{reward.icon}</span>
          <span className="text-xs font-bold leading-tight">{reward.name}</span>
          <span className="line-clamp-3 text-[10px] leading-tight text-muted">{reward.desc}</span>
          <span className="mt-1 text-[10px] text-accent">úroveň {reward.level}</span>
        </div>
      </motion.div>
    </motion.button>
  )
}
