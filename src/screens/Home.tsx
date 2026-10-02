import { motion } from 'framer-motion'
import { useNav } from '../nav'
import { updateSettings, useApp } from '../lib/store'
import { deriveGame, fmt } from '../lib/game'
import { levelFromXp, themesUnlockedByAnyone } from '../lib/progression'
import { THEMES } from '../lib/themes'
import { Avatar, Btn, Screen, listItem } from '../components/ui'
import { DieLogo } from '../components/DieLogo'

export function Home() {
  const nav = useNav()
  const app = useApp()
  const game = app.activeGame
  const d = game ? deriveGame(game) : null
  const leader = [...app.profiles].sort((a, b) => b.xp - a.xp).slice(0, 3)
  const menuThemes = themesUnlockedByAnyone(app.profiles)

  const tiles = [
    { label: 'Profily', icon: '👥', sub: `${app.profiles.length} hráčov`, to: { name: 'profiles' as const } },
    { label: 'Kockový pas', icon: '🗺️', sub: 'Odmeny a úrovne', to: { name: 'pass' as const } },
    { label: 'Štatistiky', icon: '📊', sub: `${app.history.length} odohraných`, to: { name: 'stats' as const } },
  ]

  return (
    <Screen className="safe-top safe-bottom gap-5 px-4">
      <div className="flex justify-end gap-2 pt-1">
        <Btn className="!rounded-full h-10 w-10 !p-0 text-lg" onClick={() => updateSettings({ sound: !app.settings.sound })} aria-label="Zvuk">
          {app.settings.sound ? '🔊' : '🔇'}
        </Btn>
        <Btn className="!rounded-full h-10 w-10 !p-0 text-lg" onClick={() => updateSettings({ vibration: !app.settings.vibration })} aria-label="Vibrácie">
          {app.settings.vibration ? '📳' : '📴'}
        </Btn>
      </div>

      <motion.div className="flex flex-col items-center pt-2 text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <DieLogo />
        <h1 className="text-glow mt-5 text-5xl font-black tracking-tight">Kockovník</h1>
        <p className="mt-1 text-muted">Ty hádžeš, ja počítam.</p>
      </motion.div>

      {game && d && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav.go({ name: 'game' })}
          className="themed glass-strong glow relative overflow-hidden rounded-3xl p-4 text-left"
        >
          <div className="shimmer pointer-events-none absolute inset-0 opacity-40" />
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">Rozohraná hra</div>
          <div className="mt-1 text-lg font-bold">Pokračovať · kolo {d.round}</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {game.playerIds.map((id) => {
              const p = app.profiles.find((x) => x.id === id)
              return (
                <span key={id} className="tabular">
                  {p?.avatar} {fmt(d.totals[id])}
                </span>
              )
            })}
          </div>
        </motion.button>
      )}

      <Btn variant="accent" className="!rounded-3xl py-5 text-xl" onClick={() => nav.go({ name: 'newGame' })}>
        🎲 Nová hra
      </Btn>

      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t, i) => (
          <motion.button
            key={t.label}
            custom={i}
            variants={listItem}
            initial="hidden"
            animate="show"
            whileTap={{ scale: 0.94 }}
            onClick={() => nav.go(t.to)}
            className="themed glass flex flex-col items-center gap-1 rounded-3xl px-2 py-4"
          >
            <span className="text-3xl">{t.icon}</span>
            <span className="text-sm font-semibold">{t.label}</span>
            <span className="text-[11px] text-muted">{t.sub}</span>
          </motion.button>
        ))}
      </div>

      {leader.length > 0 && (
        <div className="themed glass rounded-3xl p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Rebríček</div>
          <div className="flex flex-col gap-2">
            {leader.map((p, i) => (
              <button key={p.id} className="flex items-center gap-3 text-left" onClick={() => nav.go({ name: 'profile', id: p.id })}>
                <span className="w-5 text-center text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                <Avatar profile={p} size={36} />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                <span className="text-sm text-muted">úr. {levelFromXp(p.xp)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {menuThemes.length > 1 && (
        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted">Téma menu</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {menuThemes.map((t) => (
              <Btn
                key={t}
                className={`shrink-0 !rounded-full !py-2 text-sm ${app.settings.menuThemeId === t ? 'glow' : ''}`}
                onClick={() => updateSettings({ menuThemeId: t })}
              >
                {THEMES[t].emoji} {THEMES[t].name}
              </Btn>
            ))}
          </div>
        </div>
      )}
    </Screen>
  )
}
