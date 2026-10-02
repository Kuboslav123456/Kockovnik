import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useNav } from '../nav'
import { startGame, useApp } from '../lib/store'
import { fmt } from '../lib/game'
import { levelFromXp } from '../lib/progression'
import { Avatar, Btn, Header, Screen, Section, Toggle } from '../components/ui'
import { NewProfileForm } from '../components/NewProfileForm'

const TARGETS = [2000, 5000, 10000]
const ENTRIES = [350, 500, 750, 1000]

export function NewGame() {
  const nav = useNav()
  const app = useApp()
  const last = app.history[app.history.length - 1]

  const [selected, setSelected] = useState<string[]>(() =>
    last ? last.playerIds.filter((id) => app.profiles.some((p) => p.id === id)) : [],
  )
  const [target, setTarget] = useState(last?.target ?? 10000)
  const [custom, setCustom] = useState(!TARGETS.includes(last?.target ?? 10000))
  const [lastRound, setLastRound] = useState(last?.rules.lastRound ?? true)
  const [minEntryOn, setMinEntryOn] = useState((last?.rules.minEntry ?? 0) > 0)
  const [minEntry, setMinEntry] = useState(last?.rules.minEntry || 350)
  const [adding, setAdding] = useState(app.profiles.length === 0)

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 6 ? s : [...s, id]))

  const shuffle = () => setSelected((s) => [...s].sort(() => Math.random() - 0.5))

  const canStart = selected.length >= 2 && target >= 100

  const start = () => {
    startGame(selected, target, { lastRound, minEntry: minEntryOn ? minEntry : 0 })
    nav.reset({ name: 'game' })
  }

  return (
    <Screen>
      <Header title="Nová hra" />

      <Section title={`Hráči · ${selected.length}/6`}>
        <div className="flex flex-col gap-2">
          {app.profiles.map((p) => {
            const idx = selected.indexOf(p.id)
            const on = idx >= 0
            return (
              <motion.button
                key={p.id}
                layout
                whileTap={{ scale: 0.97 }}
                onClick={() => toggle(p.id)}
                className={`themed flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${on ? 'glass-strong glow' : 'glass opacity-75'}`}
              >
                <Avatar profile={p} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-xs text-muted">Úroveň {levelFromXp(p.xp)}</div>
                </div>
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="btn-accent grid h-8 w-8 place-items-center rounded-full text-sm font-bold"
                    >
                      {idx + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
        <AnimatePresence>
          {adding && (
            <NewProfileForm
              onCreated={(p) => {
                setSelected((s) => (s.length < 6 ? [...s, p.id] : s))
                setAdding(false)
              }}
              onCancel={app.profiles.length ? () => setAdding(false) : undefined}
            />
          )}
        </AnimatePresence>
        <div className="mt-3 flex gap-2">
          {!adding && (
            <Btn className="flex-1" onClick={() => setAdding(true)}>
              ＋ Nový hráč
            </Btn>
          )}
          {selected.length > 1 && (
            <Btn className="flex-1" onClick={shuffle}>
              🔀 Zamiešať poradie
            </Btn>
          )}
        </div>
      </Section>

      <Section title="Hrá sa do" className="mt-6">
        <div className="grid grid-cols-4 gap-2">
          {TARGETS.map((t) => (
            <Btn
              key={t}
              className={`!px-1 tabular font-semibold ${!custom && target === t ? 'glow glass-strong' : ''}`}
              onClick={() => {
                setCustom(false)
                setTarget(t)
              }}
            >
              {fmt(t)}
            </Btn>
          ))}
          <Btn className={`!px-1 font-semibold ${custom ? 'glow glass-strong' : ''}`} onClick={() => setCustom(true)}>
            Vlastné
          </Btn>
        </div>
        <AnimatePresence>
          {custom && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <input
                type="number"
                inputMode="numeric"
                value={target || ''}
                onChange={(e) => setTarget(Math.max(0, Math.min(1_000_000, Number(e.target.value) || 0)))}
                className="themed tabular mt-2 w-full rounded-2xl border border-line bg-black/25 px-4 py-3 text-center text-2xl font-bold text-ink outline-none focus:border-accent"
                placeholder="napr. 7500"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section title="Pravidlá" className="mt-6 flex flex-col gap-2">
        <Toggle checked={lastRound} onChange={setLastRound} label="Posledné kolo" hint="Keď niekto dosiahne cieľ, ostatní majú ešte jeden ťah" />
        <Toggle checked={minEntryOn} onChange={setMinEntryOn} label="Minimálny vstup" hint={`Prvý zápis musí mať aspoň ${fmt(minEntry)} bodov`} />
        <AnimatePresence>
          {minEntryOn && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-4 gap-2 overflow-hidden">
              {ENTRIES.map((v) => (
                <Btn key={v} className={`tabular !py-2 ${minEntry === v ? 'glow glass-strong' : ''}`} onClick={() => setMinEntry(v)}>
                  {fmt(v)}
                </Btn>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <div className="safe-bottom sticky bottom-0 z-30 mt-auto px-4 pt-8" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 40%, transparent)' }}>
        <div>
          <Btn variant="accent" className="w-full !rounded-3xl py-5 text-xl" disabled={!canStart} onClick={start}>
            {selected.length < 2 ? 'Vyber aspoň 2 hráčov' : `Hrať do ${fmt(target)} 🎲`}
          </Btn>
        </div>
      </div>
    </Screen>
  )
}
