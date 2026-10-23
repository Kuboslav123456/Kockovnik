import { AnimatePresence, motion } from 'framer-motion'
import { NavProvider, useNav, type Route } from './nav'
import { getState, useApp } from './lib/store'
import { deriveGame } from './lib/game'
import { cosmetics } from './lib/progression'
import type { ThemeId } from './lib/types'
import { ThemeLayer } from './components/ThemeLayer'
import { Home } from './screens/Home'
import { NewGame } from './screens/NewGame'
import { Game } from './screens/Game'
import { Victory } from './screens/Victory'
import { Profiles } from './screens/Profiles'
import { ProfileScreen } from './screens/ProfileScreen'
import { Pass } from './screens/Pass'
import { Stats } from './screens/Stats'
import { Treasury } from './screens/Treasury'
import { Forge } from './screens/Forge'

export default function App() {
  const initial: Route = getState().activeGame ? { name: 'game' } : { name: 'home' }
  return (
    <NavProvider initial={initial}>
      <Shell />
    </NavProvider>
  )
}

// Prechod obrazoviek: len posun a priehľadnosť (bez zmenšovania celej obrazovky – to je drahé)
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '22%' : '-22%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-14%' : '14%', opacity: 0 }),
}

function Shell() {
  const { route, direction } = useNav()
  const app = useApp()

  // Aktívna téma: v hre téma hráča na ťahu, pri výhre téma víťaza, v profile téma daného hráča
  let themeId: ThemeId = app.settings.menuThemeId
  let dice = false
  const byId = (id?: string | null) => app.profiles.find((p) => p.id === id)
  const applyProfile = (id?: string | null) => {
    const p = byId(id)
    if (!p) return
    const c = cosmetics(p)
    themeId = c.themeId
    dice = c.dice
  }
  if (route.name === 'game' && app.activeGame) applyProfile(deriveGame(app.activeGame).currentPlayerId)
  if (route.name === 'victory' && app.lastResult) applyProfile(app.lastResult.game.winnerId)
  if (route.name === 'profile') applyProfile(route.id)
  if (route.name === 'pass' && route.id) {
    const p = byId(route.id)
    if (p) themeId = cosmetics(p).themeId
  }

  const key = route.name + ('id' in route ? (route.id ?? '') : '')

  return (
    <>
      <ThemeLayer themeId={themeId} dice={dice} />
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.main
          key={key}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.22, ease: 'easeOut' } }}
          style={{ willChange: 'transform, opacity' }}
          className="themed no-scrollbar fixed inset-0 overflow-y-auto overflow-x-hidden"
        >
          <RouteView route={route} />
        </motion.main>
      </AnimatePresence>
    </>
  )
}

function RouteView({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />
    case 'newGame':
      return <NewGame />
    case 'game':
      return <Game />
    case 'victory':
      return <Victory />
    case 'profiles':
      return <Profiles />
    case 'profile':
      return <ProfileScreen id={route.id} />
    case 'treasury':
      return <Treasury initialId={route.id} />
    case 'forge':
      return <Forge initialId={route.id} />
    case 'pass':
      return <Pass initialId={route.id} />
    case 'stats':
      return <Stats />
  }
}
