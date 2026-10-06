import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { DieDef } from '../lib/dice'
import { bestScore, isBust, rollFaces, scoreSelection, SCORING_RULES } from '../lib/scoring'
import { fmt } from '../lib/game'
import { sfx } from '../lib/sound'
import type { SoundId } from '../lib/types'
import { Die3D } from './Die3D'
import { Btn } from './ui'

type Phase = 'ready' | 'rolling' | 'choose' | 'bust'

/**
 * Celý ťah virtuálnymi kockami: hodíš, odložíš bodujúce kocky, hádžeš zvyšné alebo zapíšeš.
 * Keď nič nebodujúce nepadne, ťah prepadol. Keď odložíš všetkých 6, hádžeš znova všetkými.
 */
export function DiceRoller({
  die,
  minEntry,
  sound,
  onCommit,
}: {
  die: DieDef
  /** hráč ešte nemá body a platí minimálny vstup – menej sa zapísať nedá */
  minEntry: number
  sound: SoundId
  onCommit: (points: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [remaining, setRemaining] = useState(6)
  const [faces, setFaces] = useState<number[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [banked, setBanked] = useState(0)
  const [kept, setKept] = useState<number[]>([])
  const [hot, setHot] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const selFaces = selected.map((i) => faces[i])
  const selScore = scoreSelection(selFaces)
  const turnTotal = banked + (selScore ?? 0)
  const canBank = selScore != null && turnTotal >= minEntry

  const roll = (n: number) => {
    const f = rollFaces(n)
    setFaces(f)
    setSelected([])
    setPhase('rolling')
    sfx.dice()
    setTimeout(() => {
      const bust = isBust(f)
      setPhase(bust ? 'bust' : 'choose')
      if (bust) sfx.zero(sound)
    }, 850)
  }

  const toggle = (i: number) => {
    if (phase !== 'choose') return
    sfx.tap(sound)
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  }

  const keepAndRoll = () => {
    if (selScore == null) return
    const left = remaining - selected.length
    setBanked((b) => b + selScore)
    setKept((k) => [...k, ...selFaces])
    const next = left === 0 ? 6 : left
    setHot(left === 0)
    setRemaining(next)
    roll(next)
  }

  return (
    <div className="pb-1">
      <div className="flex items-baseline justify-between">
        <div className="text-sm text-muted">V tomto ťahu</div>
        <div className="num-weight text-3xl text-accent">{fmt(turnTotal)}</div>
      </div>

      {/* odložené kocky */}
      <div className="mt-1 flex min-h-7 flex-wrap items-center gap-1">
        {kept.length === 0 ? (
          <span className="text-xs italic text-faint">Zatiaľ nič odložené</span>
        ) : (
          kept.map((f, i) => (
            <span key={i} className="grid h-7 w-7 place-items-center text-[22px] leading-none" style={{ color: 'var(--t-text)' }}>
              {'⚀⚁⚂⚃⚄⚅'[f - 1]}
            </span>
          ))
        )}
      </div>

      <AnimatePresence>
        {hot && phase !== 'ready' && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-caps mt-1 text-center text-sm text-accent">
            ✦ Horúce kocky! Všetkých šesť znova ✦
          </motion.div>
        )}
      </AnimatePresence>

      {/* kocky na stole */}
      <div className="mt-3 grid min-h-[150px] grid-cols-3 place-items-center gap-y-3">
        {(phase === 'ready' ? Array.from({ length: remaining }, () => 0) : faces).map((f, i) => {
          const sel = selected.includes(i)
          return (
            <motion.button
              key={`${remaining}-${i}`}
              onClick={() => toggle(i)}
              animate={{ y: sel ? -8 : 0, scale: sel ? 1.06 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="relative grid h-[68px] w-[68px] place-items-center"
              aria-label={f ? `Kocka ${f}${sel ? ', vybraná' : ''}` : 'Kocka'}
              disabled={phase !== 'choose'}
            >
              {sel && <span className="absolute inset-0 border-2 border-accent" style={{ boxShadow: '0 0 14px var(--t-glow)' }} />}
              <Die3D die={die} size={44} rolling={phase === 'rolling'} show={phase === 'ready' ? null : f} />
            </motion.button>
          )
        })}
      </div>

      {/* stav a akcie */}
      <div className="mt-3 min-h-5 text-center text-sm">
        {phase === 'ready' && <span className="italic text-muted">Hoď kockami. Bodujúce si odlož, zvyšné môžeš hodiť znova.</span>}
        {phase === 'rolling' && <span className="italic text-muted">Kocky sa kotúľajú…</span>}
        {phase === 'choose' &&
          (selected.length === 0 ? (
            <span className="italic text-muted">Ťukni na kocky, ktoré si odložíš.</span>
          ) : selScore == null ? (
            <span className="text-accent">Tento výber neboduje – odlož len bodujúce kocky.</span>
          ) : (
            <span>
              Výber: <b className="text-accent">+{fmt(selScore)}</b>
              {turnTotal < minEntry && <span className="text-muted"> · na vstup treba {fmt(minEntry)}</span>}
            </span>
          ))}
        {phase === 'bust' && <span className="font-caps text-base text-accent">Nič nepadlo – prepadol si!</span>}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {phase === 'ready' && (
          <Btn variant="accent" className="py-3.5 text-lg" silent onClick={() => roll(remaining)}>
            🎲 Hodiť {remaining} kockami
          </Btn>
        )}
        {phase === 'choose' && (
          <>
            <Btn
              className="py-2 text-sm"
              onClick={() => setSelected(bestScore(faces).dice)}
            >
              Vybrať všetky bodujúce
            </Btn>
            <div className="grid grid-cols-2 gap-2">
              <Btn className="py-3" disabled={selScore == null} onClick={keepAndRoll}>
                Odložiť a hodiť {remaining - selected.length === 0 ? 6 : remaining - selected.length}
              </Btn>
              <Btn variant="accent" className="py-3" silent disabled={!canBank} onClick={() => onCommit(turnTotal)}>
                Zapísať {fmt(turnTotal)}
              </Btn>
            </div>
          </>
        )}
        {phase === 'bust' && (
          <Btn variant="accent" className="py-3.5" silent onClick={() => onCommit(0)}>
            Zapísať prepadnutie
          </Btn>
        )}
      </div>

      <button className="mt-3 w-full text-center text-xs text-muted underline decoration-dotted underline-offset-4" onClick={() => setShowRules((v) => !v)}>
        {showRules ? 'Skryť pravidlá bodovania' : 'Pravidlá bodovania'}
      </button>
      <AnimatePresence>
        {showRules && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-center text-xs text-muted">
            {SCORING_RULES.map((r) => (
              <li key={r} className="mt-1">
                {r}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
