import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNav } from '../nav'
import { abandonGame, addTurn, finishGame, undoTurn, useApp } from '../lib/store'
import { deriveGame, fmt, roundTable } from '../lib/game'
import { sfx } from '../lib/sound'
import { cosmetics, FONTS } from '../lib/progression'
import type { ActiveGame, BurstId, KeypadId, Profile } from '../lib/types'
import { AnimatedNumber, Avatar, Btn, PlayerName } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { Burst } from '../components/Burst'
import type { HTMLMotionProps } from 'framer-motion'

const QUICK = [50, 100, 500, 1000]
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫']

const UNKNOWN: Omit<Profile, 'id'> = {
  name: '?', avatar: '❔', xp: 0, achievements: [], themeId: 'wood', titleId: null, effectId: 'confetti',
  diceBackground: false, keypadId: 'classic', burstId: 'float', fontId: 'classic', soundId: 'classic', createdAt: 0,
}

/** Kláves v štýle, ktorý si hráč na ťahu odomkol */
function Key({ skin, primary, className = '', ...rest }: HTMLMotionProps<'button'> & { skin: KeypadId; primary?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={`key key-${skin} ${primary ? 'key-primary' : ''} disabled:opacity-40 ${className}`}
      {...rest}
    />
  )
}

export function Game() {
  const nav = useNav()
  const app = useApp()
  const game = app.activeGame

  // presmerovať smie len aktívna obrazovka – odchádzajúca (počas animácie) nie
  useEffect(() => {
    if (!game && nav.route.name === 'game') nav.reset({ name: 'home' })
  }, [game]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) return null
  return <GameView game={game} profiles={app.profiles} />
}

function GameView({ game, profiles }: { game: ActiveGame; profiles: Profile[] }) {
  const nav = useNav()
  const d = deriveGame(game)
  const byId = (id: string): Profile => profiles.find((p) => p.id === id) ?? { ...UNKNOWN, id }
  const current = byId(d.currentPlayerId)
  // odomknuté veci hráča na ťahu – vidia ich všetci pri stole
  const cur = cosmetics(current)

  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ playerId: string; points: number; key: number; burst: BurstId } | null>(null)
  const [thunder, setThunder] = useState(0)
  const screen = useAnimationControls()
  const [showHistory, setShowHistory] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const shake = useAnimationControls()
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const value = Number(input || 0)
  const compact = game.playerIds.length >= 4

  // Aktuálny hráč vždy na očiach
  useEffect(() => {
    cardRefs.current[d.currentPlayerId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [d.currentPlayerId])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 2200)
    return () => clearTimeout(t)
  }, [error])

  const fail = (msg: string) => {
    sfx.error(cur.soundId)
    setError(msg)
    void shake.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.4 } })
  }

  const press = (k: string) => {
    sfx.tap(cur.soundId)
    if (k === '⌫') return setInput((s) => s.slice(0, -1))
    setInput((s) => {
      const next = (s === '0' ? '' : s) + k
      const clean = next.replace(/^0+/, '')
      return clean.length > 6 ? s : clean
    })
  }

  const quick = (n: number) => {
    sfx.tap(cur.soundId)
    setInput((s) => String(Math.min(999999, Number(s || 0) + n)))
  }

  const commit = (points: number) => {
    if (points > 0 && game.rules.minEntry > 0 && d.totals[d.currentPlayerId] === 0 && points < game.rules.minEntry) {
      return fail(`Na vstup do hry treba aspoň ${fmt(game.rules.minEntry)} bodov`)
    }
    if (points === 0) sfx.zero(cur.soundId)
    else sfx.add(points, cur.soundId)
    if (points > 0 && cur.burstId === 'lightning') {
      sfx.thunder()
      setThunder(Date.now())
      void screen.start({ x: [0, -9, 9, -6, 6, -2, 0], y: [0, 4, -4, 2, 0], transition: { duration: 0.45 } })
    }
    setFlash({ playerId: d.currentPlayerId, points, key: Date.now(), burst: cur.burstId })
    addTurn(points)
    setInput('')
  }

  const undo = () => {
    if (!game.turns.length) return
    sfx.undo(cur.soundId)
    setFlash(null)
    undoTurn()
    setInput('')
  }

  const confirmWin = () => {
    sfx.win(cosmetics(d.winnerId ? byId(d.winnerId) : undefined).soundId)
    if (finishGame()) nav.reset({ name: 'victory' })
  }

  return (
    <motion.div animate={screen} className="mx-auto flex h-[100dvh] w-full max-w-md flex-col">
      <AnimatePresence>
        {thunder > 0 && (
          <motion.div
            key={thunder}
            className="pointer-events-none fixed inset-0 z-50 bg-white"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: [0.85, 0, 0.5, 0] }}
            transition={{ duration: 0.5, times: [0, 0.3, 0.45, 1] }}
            onAnimationComplete={() => setThunder(0)}
          />
        )}
      </AnimatePresence>
      {/* Horná lišta */}
      <div className="safe-top flex items-center gap-2 px-4 pb-2">
        <Btn className="!rounded-full h-11 w-11 !p-0 text-xl" onClick={() => nav.reset({ name: 'home' })} aria-label="Domov">
          ⌂
        </Btn>
        <div className="flex-1 text-center">
          <div className="text-xs uppercase tracking-widest text-muted">Hrá sa do {fmt(game.target)}</div>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={d.round} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="text-lg font-bold">
              Kolo {d.round}
            </motion.div>
          </AnimatePresence>
        </div>
        <Btn className="!rounded-full h-11 w-11 !p-0 text-lg" onClick={() => setShowHistory(true)} aria-label="História">
          📜
        </Btn>
        <Btn className="!rounded-full h-11 w-11 !p-0 text-lg" onClick={() => setShowMenu(true)} aria-label="Menu">
          ⋯
        </Btn>
      </div>

      <AnimatePresence>
        {d.finalRound && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4"
          >
            <div className="btn-accent mb-2 rounded-2xl px-4 py-2 text-center text-sm font-semibold">
              🔥 Posledné kolo! {byId(d.triggeredBy!).name} má {fmt(d.totals[d.triggeredBy!])}. Zostáva {d.turnsLeft}{' '}
              {d.turnsLeft === 1 ? 'ťah' : d.turnsLeft < 5 ? 'ťahy' : 'ťahov'}.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hráči */}
      <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1 ${compact ? 'grid grid-cols-2 content-start gap-2' : 'flex flex-col gap-2'}`}>
        {game.playerIds.map((id) => {
          const p = byId(id)
          const active = id === d.currentPlayerId && !d.finished
          const total = d.totals[id]
          const lastTurn = [...game.turns].reverse().find((t) => t.playerId === id)
          const ratio = Math.min(1, total / game.target)
          const leader = d.ranking[0] === id && total > 0
          return (
            <motion.div
              key={id}
              ref={(el) => {
                cardRefs.current[id] = el
              }}
              layout
              animate={{ scale: active ? 1 : 0.97, opacity: active ? 1 : 0.78 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={`themed relative rounded-3xl ${compact ? 'p-3' : 'p-3.5'} ${active ? 'glass-strong glow' : 'glass'}`}
            >
              <div className={`flex items-center gap-3 ${compact ? 'flex-col items-start gap-2' : ''}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar profile={p} size={compact ? 34 : 44} glow={active} />
                  <PlayerName profile={p as Profile} className={compact ? 'text-sm' : ''} />
                  {leader && <span className="text-sm">👑</span>}
                </div>
                <div className={`${compact ? 'w-full' : 'ml-auto'} text-right`}>
                  <AnimatedNumber value={total} className={`inline-block ${compact ? 'text-2xl' : 'text-3xl'} font-black ${FONTS[cosmetics(p).fontId].className}`} />
                  <div className="h-4 text-xs text-muted tabular">
                    {lastTurn ? (lastTurn.points ? `posledný +${fmt(lastTurn.points)}` : 'posledný ✗') : active ? 'na ťahu' : ''}
                  </div>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
                <motion.div
                  className="btn-accent h-full rounded-full"
                  initial={false}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={{ type: 'spring', stiffness: 70, damping: 18 }}
                />
              </div>
              <AnimatePresence>
                {flash?.playerId === id && (
                  <motion.div key={flash.key} className="pointer-events-none absolute inset-0 z-10" exit={{ opacity: 0 }}>
                    <Burst burst={flash.burst} points={flash.points} onDone={() => setFlash(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Zadávanie bodov */}
      <motion.div animate={shake} className="themed glass-strong safe-bottom rounded-t-[2rem] px-4 pt-3">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.id}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="flex min-w-0 items-center gap-2"
            >
              <span className="text-2xl">{current.avatar}</span>
              <span className="truncate font-semibold">{current.name}</span>
            </motion.div>
          </AnimatePresence>
          <div className="ml-auto min-w-0 text-right">
            <motion.div key={value} initial={{ scale: 1.12 }} animate={{ scale: 1 }} className={`tabular inline-block text-4xl font-black ${value ? 'text-accent text-glow' : 'text-muted'} ${FONTS[cur.fontId].className}`}>
              {value ? `+${fmt(value)}` : '0'}
            </motion.div>
          </div>
        </div>
        <div className="h-5 text-center text-xs">
          <AnimatePresence>
            {error && (
              <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-semibold text-accent2">
                {error}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Klávesnica sa pri zmene hráča "prevráti" do jeho štýlu */}
        <motion.div
            key={current.id + cur.keypadId}
            initial={game.turns.length ? { opacity: 0.4, rotateX: -30, y: 10 } : false}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ transformPerspective: 700 }}
          >
            <div className="grid grid-cols-4 gap-2">
              {QUICK.map((q) => (
                <Key key={q} skin={cur.keypadId} className="tabular whitespace-nowrap px-1 py-2 text-sm font-semibold" onClick={() => quick(q)}>
                  +{q}
                </Key>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {KEYS.map((k) => (
                <Key key={k} skin={cur.keypadId} className="h-12 text-2xl font-semibold" onClick={() => press(k)} aria-label={k === '⌫' ? 'Zmazať' : k}>
                  {k}
                </Key>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-[1fr_1.4fr_2fr] gap-2 pb-1">
              <Key skin={cur.keypadId} className="whitespace-nowrap px-1 py-3 text-sm" disabled={!game.turns.length} onClick={undo}>
                ↩︎ Späť
              </Key>
              <Key skin={cur.keypadId} className="whitespace-nowrap px-1 py-3 text-sm" onClick={() => commit(0)}>
                💨 Prepadol
              </Key>
              <Key skin={cur.keypadId} primary className="py-3 text-lg font-semibold" disabled={!value} onClick={() => commit(value)}>
                Zapísať ✓
              </Key>
            </div>
          </motion.div>
      </motion.div>

      <Sheet open={showHistory} onClose={() => setShowHistory(false)} title="História kôl">
        <RoundTable game={game} byId={byId} />
      </Sheet>

      <Sheet open={showMenu} onClose={() => setShowMenu(false)} title="Hra">
        <div className="flex flex-col gap-2">
          <Btn
            onClick={() => {
              setShowMenu(false)
              nav.reset({ name: 'home' })
            }}
          >
            Odložiť hru (pokračovať neskôr)
          </Btn>
          <Btn
            className="!text-accent2"
            onClick={() => {
              if (confirm('Naozaj ukončiť hru bez výsledku? Body sa nezapíšu.')) {
                abandonGame()
                nav.reset({ name: 'home' })
              }
            }}
          >
            Zrušiť hru bez výsledku
          </Btn>
        </div>
      </Sheet>

      {/* Koniec hry – potvrdenie */}
      <AnimatePresence>
        {d.finished && d.winnerId && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="themed glass-strong glow w-full max-w-sm rounded-[2rem] p-6 text-center"
            >
              <motion.div className="text-6xl" animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.9, delay: 0.2 }}>
                🏆
              </motion.div>
              <div className="mt-3 text-2xl font-black">{byId(d.winnerId).name} vyhráva!</div>
              <div className="tabular mt-1 text-muted">{fmt(d.totals[d.winnerId])} bodov</div>
              <Btn variant="accent" className="mt-6 w-full py-4 text-lg" silent onClick={confirmWin}>
                Potvrdiť výhru 🎉
              </Btn>
              <Btn variant="ghost" className="mt-2 w-full" silent onClick={undo}>
                ↩︎ Preklep – vrátiť posledný zápis
              </Btn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RoundTable({ game, byId }: { game: ActiveGame; byId: (id: string) => Pick<Profile, 'name' | 'avatar'> }) {
  const rows = roundTable(game)
  const d = deriveGame(game)
  if (!rows.length) return <div className="py-8 text-center text-muted">Zatiaľ žiadne zápisy.</div>
  return (
    <div className="no-scrollbar max-h-[60vh] overflow-auto rounded-2xl border border-line">
      <table className="tabular w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-surface-strong backdrop-blur">
          <tr>
            <th className="px-2 py-2 text-left text-xs text-muted">#</th>
            {game.playerIds.map((id) => (
              <th key={id} className="px-2 py-2 text-right">
                <div className="text-lg">{byId(id).avatar}</div>
                <div className="truncate text-[11px] font-medium text-muted">{byId(id).name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.round} className="border-t border-line">
              <td className="px-2 py-1.5 text-xs text-muted">{r.round}</td>
              {r.cells.map((c, i) => (
                <td key={i} className="px-2 py-1.5 text-right">
                  {c === null ? (
                    ''
                  ) : (
                    <>
                      <div className={c ? 'font-semibold' : 'text-muted'}>{c ? fmt(c) : '✗'}</div>
                      <div className="text-[10px] text-muted">{fmt(r.running[i] ?? 0)}</div>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-surface-strong backdrop-blur">
          <tr className="border-t border-line">
            <td className="px-2 py-2 text-xs text-muted">Σ</td>
            {game.playerIds.map((id) => (
              <td key={id} className="px-2 py-2 text-right font-black text-accent">
                {fmt(d.totals[id])}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
