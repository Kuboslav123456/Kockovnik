import { motion, useAnimationControls } from 'framer-motion'
import { useNav, type Route } from '../nav'
import { updateSettings, useApp } from '../lib/store'
import { deriveGame, fmt, toRoman } from '../lib/game'
import { themesUnlockedByAnyone } from '../lib/progression'
import { sfx } from '../lib/sound'
import { THEMES } from '../lib/themes'

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.07, type: 'spring' as const, stiffness: 240, damping: 26 } }),
}

export function Home() {
  const nav = useNav()
  const app = useApp()
  const game = app.activeGame
  const d = game ? deriveGame(game) : null
  const menuThemes = themesUnlockedByAnyone(app.profiles)
  const wiggle = useAnimationControls()

  const links: { label: string; to: Route }[] = [
    { label: 'Družina', to: { name: 'profiles' } },
    { label: 'Dobrodružstvo', to: { name: 'pass' } },
    { label: 'Letopisy', to: { name: 'stats' } },
    { label: 'Klenotnica', to: { name: 'treasury' } },
  ]

  const roll = () => {
    sfx.dice()
    void wiggle.start({ rotate: [0, -9, 8, -5, 3, 0], scale: [1, 1.06, 1], transition: { duration: 0.55 } })
  }

  const toggles: { label: string; on: boolean; flip: () => void }[] = [
    { label: 'Zvuk', on: app.settings.sound, flip: () => updateSettings({ sound: !app.settings.sound }) },
    { label: 'Vibrácie', on: app.settings.vibration, flip: () => updateSettings({ vibration: !app.settings.vibration }) },
    { label: 'Rímske I–III', on: app.settings.romanKeys, flip: () => updateSettings({ romanKeys: !app.settings.romanKeys }) },
  ]

  return (
    <div className="relative mx-auto min-h-full w-full max-w-md" style={{ paddingBottom: 130 }}>
      {/* rám strany */}
      <div className="page-frame absolute" style={{ left: 18, right: 18, bottom: 18, top: 'calc(max(env(safe-area-inset-top), 12px) + 20px)' }} />

      <div className="relative px-[38px] text-center" style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 12px) + 52px)' }}>
        <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="font-caps text-[13px] tracking-[0.2em] text-accent">
          ✠ Liber Aleae ✠
        </motion.div>

        <motion.div custom={1} variants={rise} initial="hidden" animate="show" className="mt-3.5 flex items-end justify-center gap-1">
          <motion.button
            animate={wiggle}
            whileTap={{ scale: 0.94 }}
            onClick={roll}
            aria-label="Hodiť kockou"
            className="initial-box initial-box-logo shrink-0"
            style={{ width: 74, height: 80, fontSize: 72 }}
          >
            K
          </motion.button>
          <span className="font-display leading-none" style={{ fontSize: 'clamp(32px, 11.5vw, 46px)' }}>
            ockovník
          </span>
        </motion.div>

        <motion.p custom={2} variants={rise} initial="hidden" animate="show" className="mt-3 text-base italic text-muted">
          Tu sa zapisujú hody a slávne činy pri stole.
        </motion.p>
      </div>

      {game && d && (
        <motion.div custom={3} variants={rise} initial="hidden" animate="show" className="relative mx-[38px] mt-[30px] border-t border-rule-strong pt-3.5">
          <div className="font-caps text-[13px] tracking-[0.12em] text-accent">Kapitola {toRoman(d.round)} — rozohraná</div>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 text-[17px]">
            {d.ranking.map((id) => {
              const p = app.profiles.find((x) => x.id === id)
              return (
                <div key={id} className="contents">
                  <span className="truncate">
                    {p?.avatar} {p?.name ?? '?'}
                  </span>
                  <span className="tabular">{fmt(d.totals[id])}</span>
                </div>
              )
            })}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => nav.go({ name: 'game' })} className="mt-2.5 min-h-11 text-lg italic text-accent">
            Pokračovať v kronike ☞
          </motion.button>
        </motion.div>
      )}

      <motion.div custom={4} variants={rise} initial="hidden" animate="show" className="relative mx-[38px] mt-[26px]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            sfx.tap()
            nav.go({ name: 'newGame' })
          }}
          className="btn-accent cta w-full rounded-2xl p-3.5 text-[22px]"
        >
          Nová kapitola
        </motion.button>
      </motion.div>

      <motion.nav custom={5} variants={rise} initial="hidden" animate="show" className="font-caps relative mx-[38px] mt-[14px] grid grid-cols-2 text-base text-ink">
        {links.map((l) => (
          <motion.button
            key={l.label}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              sfx.tap()
              nav.go(l.to)
            }}
            className="min-h-11 px-1"
          >
            ❦ {l.label}
          </motion.button>
        ))}
      </motion.nav>

      <motion.div custom={6} variants={rise} initial="hidden" animate="show" className="font-caps relative mx-[38px] mt-4 border-t border-rule pt-3 text-sm text-ink">
        <div className="flex flex-wrap justify-center gap-x-4">
          {toggles.map((t) => (
            <button
              key={t.label}
              className="min-h-11"
              onClick={() => {
                t.flip()
                sfx.tap()
              }}
            >
              {t.label} <span className={t.on ? 'text-accent' : 'text-muted'}>{t.on ? '✓' : '✗'}</span>
            </button>
          ))}
        </div>
        {menuThemes.length > 1 && (
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-0">
            <span className="min-h-11 content-center text-muted">Téma:</span>
            {menuThemes.map((t) => (
              <button
                key={t}
                onClick={() => {
                  sfx.tap()
                  updateSettings({ menuThemeId: t })
                }}
                className={`min-h-11 ${app.settings.menuThemeId === t ? 'text-accent underline decoration-accent2 underline-offset-4' : ''}`}
              >
                {THEMES[t].name}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* vosková pečať */}
      <motion.div
        className="wax-seal absolute"
        style={{ right: 30, bottom: 44, width: 58, height: 58, fontSize: 22 }}
        initial={{ y: -40, rotate: -40, opacity: 0 }}
        animate={{ y: 0, rotate: -12, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 12 }}
      >
        K
      </motion.div>
    </div>
  )
}
