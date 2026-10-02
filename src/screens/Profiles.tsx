import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNav } from '../nav'
import { useApp } from '../lib/store'
import { playerStats } from '../lib/game'
import { Avatar, Btn, Header, PlayerName, Screen, Section, XpBar, listItem } from '../components/ui'
import { NewProfileForm } from '../components/NewProfileForm'

export function Profiles() {
  const nav = useNav()
  const app = useApp()
  const [adding, setAdding] = useState(app.profiles.length === 0)

  return (
    <Screen className="safe-bottom">
      <Header title="Družina" />
      <Section>
        <div className="flex flex-col gap-2">
          {app.profiles.map((p, i) => {
            const s = playerStats(app.history, p.id)
            return (
              <motion.button
                key={p.id}
                custom={i}
                variants={listItem}
                initial="hidden"
                animate="show"
                whileTap={{ scale: 0.97 }}
                onClick={() => nav.go({ name: 'profile', id: p.id })}
                className="themed glass flex flex-col gap-3 rounded-3xl p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Avatar profile={p} size={48} />
                  <PlayerName profile={p} className="flex-1" />
                  <div className="text-right text-sm">
                    <div>⭐ {s.wins}</div>
                    <div className="text-xs text-muted">{s.games} hier</div>
                  </div>
                </div>
                <XpBar xp={p.xp} />
              </motion.button>
            )
          })}
        </div>
        <AnimatePresence>
          {adding && (
            <NewProfileForm
              onCreated={() => setAdding(false)}
              onCancel={app.profiles.length ? () => setAdding(false) : undefined}
            />
          )}
        </AnimatePresence>
        {!adding && (
          <Btn className="mt-3 w-full" onClick={() => setAdding(true)}>
            ＋ Nový hráč
          </Btn>
        )}
      </Section>
    </Screen>
  )
}
