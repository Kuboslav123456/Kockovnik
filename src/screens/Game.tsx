import { AnimatePresence, motion, useAnimationControls, type HTMLMotionProps } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNav } from '../nav'
import { abandonGame, addTurn, finishGame, undoTurn, useApp } from '../lib/store'
import { deriveGame, fmt, roundTable, toRoman } from '../lib/game'
import { sfx } from '../lib/sound'
import { cosmetics, FONTS, TITLES } from '../lib/progression'
import { markEffectPlayed, playEffect } from '../lib/effects'
import { THEMES } from '../lib/themes'
import type { ActiveGame, BurstId, KeypadId, Profile } from '../lib/types'
import { AnimatedNumber, Btn } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { Burst } from '../components/Burst'

const QUICK = [50, 100, 500, 1000]
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫']
const ROMAN_KEYS: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III' }

const UNKNOWN: Omit<Profile, 'id'> = {
  name: '?', avatar: '❔', xp: 0, achievements: [], themeId: 'manuscript', titleId: null, effectId: 'confetti',
  diceBackground: false, keypadId: 'classic', burstId: 'float', fontId: 'classic', soundId: 'classic', createdAt: 0,
}

/** Rozdelí meno na iniciálu a zvyšok (správne aj pre znaky mimo BMP). */
function splitName(name: string) {
  const chars = Array.from(name.trim() || '?')
  return { initial: chars[0].toLocaleUpperCase('sk-SK'), rest: chars.slice(1).join('') }
}

/** „A Sofi hodila kockami a padlo jej…“ – rod podľa profilu, inak neutrálne */
function quote(p: Profile) {
  if (p.gender === 'f') return `„A ${p.name} hodila kockami a padlo jej…“`
  if (p.gender === 'm') return `„A ${p.name} hodil kockami a padlo mu…“`
  return `„${p.name} hádže…“`
}

/** Kláves v štýle, ktorý si hráč na ťahu odomkol */
function Key({ skin, primary, className = '', ...rest }: HTMLMotionProps<'button'> & { skin: KeypadId; primary?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
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
  return <GameView game={game} profiles={app.profiles} romanKeys={app.settings.romanKeys} />
}

function GameView({ game, profiles, romanKeys }: { game: ActiveGame; profiles: Profile[]; romanKeys: boolean }) {
  const nav = useNav()
  const d = deriveGame(game)
  const byId = (id: string): Profile => profiles.find((p) => p.id === id) ?? { ...UNKNOWN, id }
  const current = byId(d.currentPlayerId)
  // odomknuté veci hráča na ťahu – vidia ich všetci pri stole
  const cur = cosmetics(current)

  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ playerId: string; points: number; key: number; burst: BurstId } | null>(null)
  const [zero, setZero] = useState<{ playerId: string; key: number } | null>(null)
  const [thunder, setThunder] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const shake = useAnimationControls()
  const screen = useAnimationControls()
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const value = Number(input || 0)

  // Aktuálny hráč vždy na očiach
  useEffect(() => {
    rowRefs.current[d.currentPlayerId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [d.currentPlayerId])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 2200)
    return () => clearTimeout(t)
  }, [error])

  // preškrtnutie po „Prepadol“ zmizne po 1 s
  useEffect(() => {
    if (!zero) return
    const t = setTimeout(() => setZero(null), 1000)
    return () => clearTimeout(t)
  }, [zero])

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
    if (points === 0) {
      sfx.zero(cur.soundId)
      setZero({ playerId: d.currentPlayerId, key: Date.now() })
    } else {
      sfx.add(points, cur.soundId)
      if (cur.burstId === 'lightning') {
        sfx.thunder()
        setThunder(Date.now())
        void screen.start({ x: [0, -9, 9, -6, 6, -2, 0], y: [0, 4, -4, 2, 0], transition: { duration: 0.45 } })
      }
      setFlash({ playerId: d.currentPlayerId, points, key: Date.now(), burst: cur.burstId })
    }
    addTurn(points)
    setInput('')
  }

  const undo = () => {
    if (!game.turns.length) return
    sfx.undo(cur.soundId)
    setFlash(null)
    setZero(null)
    undoTurn()
    setInput('')
  }

  const winner = d.winnerId ? byId(d.winnerId) : null

  const confirmWin = () => {
    sfx.win(cosmetics(winner ?? undefined).soundId)
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
      <div className="flex items-baseline gap-1 px-3" style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 12px) + 18px)' }}>
        <button className="grid h-11 w-11 shrink-0 place-items-center self-center text-xl text-muted" onClick={() => { sfx.tap(); nav.reset({ name: 'home' }) }} aria-label="Domov">
          ⌂
        </button>
        <motion.span
          key={d.round}
          initial={game.turns.length ? { y: 12, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          className="font-display whitespace-nowrap text-[30px] leading-none"
        >
          {/* v gotickom písme sa I a J nedajú rozlíšiť – rímske číslo je preto v IM Fell */}
          Kolo <span className="font-sans">{toRoman(d.round)}</span>
        </motion.span>
        <div className="font-caps ml-auto whitespace-nowrap text-[13px] text-accent">
          do {fmt(game.target)} ·{' '}
          <button className="min-h-11" onClick={() => { sfx.tap(); setShowHistory(true) }}>
            ✒ kronika
          </button>
        </div>
        <button className="grid h-11 w-11 shrink-0 place-items-center self-center text-xl text-muted" onClick={() => { sfx.tap(); setShowMenu(true) }} aria-label="Menu">
          ⋯
        </button>
      </div>

      <AnimatePresence>
        {d.finalRound && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="font-caps mx-[18px] mt-2 bg-accent px-3 py-1.5 text-center text-[13px] text-on-accent">
              ✠ Posledné kolo! {byId(d.triggeredBy!).name} má {fmt(d.totals[d.triggeredBy!])}. Zostáva {d.turnsLeft}{' '}
              {d.turnsLeft === 1 ? 'ťah' : d.turnsLeft < 5 ? 'ťahy' : 'ťahov'}.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hráči – zapisujú sa ako riadky kroniky */}
      <div className="no-scrollbar mx-[18px] mt-2.5 flex min-h-0 shrink flex-col gap-0.5 overflow-y-auto">
        {game.playerIds.map((id, i) => {
          const p = byId(id)
          const c = cosmetics(p)
          const active = id === d.currentPlayerId && !d.finished
          const total = d.totals[id]
          const ratio = Math.min(1, total / game.target)
          const leader = d.ranking[0] === id && total > 0
          const last = i === game.playerIds.length - 1
          const { initial, rest } = splitName(p.name)
          const struck = zero?.playerId === id
          const ink = flash?.playerId === id && flash.points >= 1000 && flash.burst === 'float'
          return (
            <motion.div
              key={id}
              ref={(el) => {
                rowRefs.current[id] = el
              }}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={`themed relative flex shrink-0 items-center gap-2.5 px-3 ${active ? 'py-2.5' : 'py-2'} ${!active && !last ? 'border-b border-rule' : ''}`}
              style={{
                background: active ? 'var(--t-surface-strong)' : undefined,
                borderLeft: `4px solid ${active ? 'var(--t-accent)' : 'transparent'}`,
              }}
            >
              <motion.div
                className="flex min-w-0 flex-1 items-center gap-2.5"
                animate={struck ? { x: [0, -8, 8, -4, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
              >
                {/* iniciála */}
                <div className="relative grid w-[34px] shrink-0 place-items-center">
                  <AnimatePresence>
                    {ink && (
                      <motion.span
                        key={flash!.key}
                        className="absolute h-9 w-9 rounded-full bg-accent"
                        initial={{ scale: 0, opacity: 0.25 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                  {active ? (
                    <motion.span
                      key={`on-${id}-${d.round}`}
                      className="initial-box relative"
                      style={{ width: 34, height: 36, fontSize: 28 }}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    >
                      {initial}
                    </motion.span>
                  ) : (
                    <span className="font-display relative text-[26px] leading-none text-accent">{initial}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className={`relative truncate ${active ? 'text-lg' : 'text-base'}`}>
                    {rest}
                    <span className="ml-1 text-[0.8em]">{p.avatar}</span>
                    {c.titleId && <span className="text-[0.8em] italic text-muted">, {TITLES[c.titleId]}</span>}
                    {leader && <span className="ml-1 text-accent2">♛</span>}
                    {struck && (
                      <motion.span
                        key={zero!.key}
                        className="absolute left-0 right-1 top-1/2 h-[2px] origin-left bg-accent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </div>
                  <div className={`mt-1 overflow-hidden bg-track ${active ? 'h-[5px]' : 'h-1'}`}>
                    <motion.div
                      className={`h-full ${active ? 'bar-fill' : 'bar-fill-ink'}`}
                      initial={false}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ type: 'spring', stiffness: 70, damping: 18 }}
                    />
                  </div>
                </div>
              </motion.div>

              <AnimatedNumber
                value={total}
                className={`num-weight inline-block shrink-0 leading-none ${active ? 'text-2xl' : 'text-[19px]'} ${FONTS[c.fontId].className}`}
              />

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

      {/* Zadávanie: citát, hodnota, klávesnica */}
      {/* zadávanie má prirodzenú výšku a nezmenšuje sa – pri malom displeji sa posúva zoznam hráčov */}
      <motion.div animate={shake} className="flex shrink-0 grow basis-auto flex-col">
        <div className="mx-[22px] mt-3 text-center">
          <motion.div
            key={current.id}
            initial={game.turns.length ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="truncate text-[15px] italic text-muted"
          >
            {quote(current)}
          </motion.div>
          <motion.div
            key={value}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            className={`num-weight tabular mt-0.5 inline-block text-[56px] leading-none ${value ? 'text-accent' : 'text-faint'} ${FONTS[cur.fontId].className}`}
          >
            {value ? `+${fmt(value)}` : '0'}
          </motion.div>
          <div className="h-4 text-xs text-accent">
            <AnimatePresence>
              {error && (
                <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {error}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Klávesnica sa pri zmene hráča "prevráti" do jeho štýlu */}
        <motion.div
          key={current.id + cur.keypadId}
          initial={game.turns.length ? { opacity: 0.4, rotateX: -30, y: 10 } : false}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{ transformPerspective: 700, paddingBottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 18px)' }}
          className="mt-auto px-4 pt-2"
        >
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK.map((q) => (
              <Key key={q} skin={cur.keypadId} className="key-quick tabular min-h-11 whitespace-nowrap px-1 text-[15px] font-semibold" onClick={() => quick(q)}>
                +{q}
              </Key>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {KEYS.map((k) => (
              <Key key={k} skin={cur.keypadId} className="min-h-12 text-2xl font-semibold" onClick={() => press(k)} aria-label={k === '⌫' ? 'Zmazať' : k}>
                {romanKeys && ROMAN_KEYS[k] ? ROMAN_KEYS[k] : k}
              </Key>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-[1fr_1fr_1.7fr] gap-1.5">
            <Key skin={cur.keypadId} className="key-action min-h-11 whitespace-nowrap px-1 text-[15px]" disabled={!game.turns.length} onClick={undo}>
              Späť
            </Key>
            <Key skin={cur.keypadId} className="key-action min-h-11 whitespace-nowrap px-1 text-[15px]" onClick={() => commit(0)}>
              Prepadol
            </Key>
            <Key skin={cur.keypadId} primary className="key-action min-h-11 whitespace-nowrap px-1 text-[15px] font-semibold" disabled={!value} onClick={() => commit(value)}>
              Zapísať do kroniky
            </Key>
          </div>
        </motion.div>
      </motion.div>

      <Sheet open={showHistory} onClose={() => setShowHistory(false)} title="Kronika kôl">
        <RoundTable game={game} byId={byId} />
      </Sheet>

      <Sheet open={showMenu} onClose={() => setShowMenu(false)} title="Kapitola">
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
            className="!text-accent"
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

      {/* Koniec hry – potvrdenie s voskovou pečaťou */}
      <AnimatePresence>
        {d.finished && winner && <WinModal key={game.id} game={game} winner={winner} total={d.totals[winner.id]} onConfirm={confirmWin} onUndo={undo} />}
      </AnimatePresence>
    </motion.div>
  )
}

function WinModal({ game, winner, total, onConfirm, onUndo }: { game: ActiveGame; winner: Profile; total: number; onConfirm: () => void; onUndo: () => void }) {
  const { initial } = splitName(winner.name)
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative w-full max-w-sm px-7 pb-6 pt-8 text-center"
        style={{ background: 'var(--t-sheet)' }}
      >
        <div className="page-frame absolute inset-2.5" />
        <motion.div
          className="wax-seal relative mx-auto"
          style={{ width: 88, height: 88, fontSize: 40 }}
          initial={{ y: -60, rotate: -30, opacity: 0 }}
          animate={{ y: 0, rotate: -12, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 320, damping: 11 }}
          onAnimationComplete={() => {
            // po dopade pečate – efekt víťaza (na obrazovke výhry sa už neopakuje)
            const c = cosmetics(winner)
            const v = THEMES[c.themeId].vars
            playEffect(c.effectId, [v['--t-accent'], v['--t-accent2'], v['--t-accent3']])
            markEffectPlayed(game.id)
          }}
        >
          {initial}
        </motion.div>
        <div className="font-display relative mt-4 text-[32px] leading-tight">{winner.name} vyhráva!</div>
        <div className="tabular relative mt-1 text-muted">{fmt(total)} bodov zapísaných v kronike</div>
        <Btn variant="accent" className="relative mt-6 w-full py-3.5 text-lg" silent onClick={onConfirm}>
          Potvrdiť výhru
        </Btn>
        <button className="relative mt-3 min-h-11 w-full italic text-muted" onClick={onUndo}>
          Preklep – vrátiť posledný zápis
        </button>
      </motion.div>
    </motion.div>
  )
}

function RoundTable({ game, byId }: { game: ActiveGame; byId: (id: string) => Pick<Profile, 'name' | 'avatar'> }) {
  const rows = roundTable(game)
  const d = deriveGame(game)
  if (!rows.length) return <div className="py-8 text-center italic text-muted">Kronika je zatiaľ prázdna.</div>
  return (
    <div className="no-scrollbar max-h-[60vh] overflow-auto border border-rule">
      <table className="tabular w-full border-collapse text-sm">
        <thead className="sticky top-0" style={{ background: 'var(--t-sheet)' }}>
          <tr>
            <th className="font-caps px-2 py-2 text-left text-xs text-muted">Kolo</th>
            {game.playerIds.map((id) => (
              <th key={id} className="px-2 py-2 text-right font-normal">
                <div className="text-lg">{byId(id).avatar}</div>
                <div className="truncate text-[11px] text-muted">{byId(id).name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.round} className="border-t border-rule">
              <td className="px-2 py-1.5 text-xs text-muted">{toRoman(r.round)}</td>
              {r.cells.map((c, i) => (
                <td key={i} className="px-2 py-1.5 text-right">
                  {c === null ? (
                    ''
                  ) : (
                    <>
                      <div className={c ? '' : 'text-faint line-through'}>{c ? fmt(c) : '0'}</div>
                      <div className="text-[10px] text-muted">{fmt(r.running[i] ?? 0)}</div>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0" style={{ background: 'var(--t-sheet)' }}>
          <tr className="border-t border-rule-strong">
            <td className="px-2 py-2 text-xs text-muted">Σ</td>
            {game.playerIds.map((id) => (
              <td key={id} className="px-2 py-2 text-right text-base text-accent">
                {fmt(d.totals[id])}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
