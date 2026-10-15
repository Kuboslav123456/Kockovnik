import { motion } from 'framer-motion'
import { fmt } from '../lib/game'
import type { FinishedGame, Profile } from '../lib/types'

/** výrazné farby čiar, dobre rozlíšiteľné na svetlom aj tmavom pozadí */
const COLORS = ['#c2261b', '#1f6fd0', '#1d9a54', '#d48a0c', '#8a3fc8', '#0e9aa0']

const W = 320
const H = 180
const PAD = { l: 34, r: 30, t: 12, b: 22 }

/**
 * Priebeh hry: priebežný súčet každého hráča po kolách. Čiary sa postupne „dokreslia“,
 * na konci čiary je avatar hráča. Prerušovaná čiara = cieľ.
 */
export function GameChart({ game, profiles, delay = 0.3 }: { game: FinishedGame; profiles: Profile[]; delay?: number }) {
  const n = game.playerIds.length
  const rounds = Math.ceil(game.turns.length / n)

  // body[i] = priebežné súčty hráča i po 0, 1, 2… kolách
  const series = game.playerIds.map((id) => {
    const pts = [0]
    let sum = 0
    game.turns.forEach((t) => {
      if (t.playerId !== id) return
      sum += t.points
      pts.push(sum)
    })
    return pts
  })

  const top = Math.max(game.target, ...series.flat())
  const step = top > 15000 ? 5000 : top > 6000 ? 2000 : 1000
  const yMax = Math.ceil((top * 1.04) / step) * step
  const x = (r: number) => PAD.l + (r / Math.max(1, rounds)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b)

  const yTicks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step)
  const xEvery = rounds > 12 ? Math.ceil(rounds / 8) : 1
  const kilo = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))

  // koľkokrát sa zmenil líder (po celých kolách)
  let changes = 0
  let leader: number | null = null
  for (let r = 1; r <= rounds; r++) {
    const vals = series.map((s) => s[Math.min(r, s.length - 1)])
    const max = Math.max(...vals)
    const tops = vals.flatMap((v, i) => (v === max ? [i] : []))
    if (tops.length === 1) {
      if (leader !== null && leader !== tops[0]) changes++
      leader = tops[0]
    }
  }

  // avatary na konci čiar sa nesmú prekrývať – rozostúpia sa aspoň o 13 px
  const labelY: number[] = []
  series
    .map((pts, i) => ({ i, y: y(pts[pts.length - 1]) }))
    .sort((a, b) => a.y - b.y)
    .forEach((l, k, arr) => {
      const prev = k ? labelY[arr[k - 1].i] : -Infinity
      labelY[l.i] = Math.max(l.y, prev + 13)
    })

  return (
    <div className="themed glass px-2 pb-3 pt-3">
      <div className="mb-1 flex items-baseline justify-between px-2">
        <span className="font-caps text-base">Priebeh hry</span>
        <span className="text-xs text-muted">{changes === 0 ? 'vedenie sa nemenilo' : `vedenie sa zmenilo ${changes}×`}</span>
      </div>
      {/* kreslí sa, až keď je graf na obrazovke */}
      <motion.svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="Graf priebehu hry"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--t-line)" strokeWidth={0.6} />
            <text x={PAD.l - 5} y={y(v) + 3.5} textAnchor="end" fontSize={9} fill="var(--t-muted)">
              {kilo(v)}
            </text>
          </g>
        ))}
        {Array.from({ length: rounds + 1 }, (_, r) =>
          r % xEvery === 0 ? (
            <text key={r} x={x(r)} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--t-muted)">
              {r}
            </text>
          ) : null,
        )}
        {/* cieľ */}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(game.target)} y2={y(game.target)} stroke="var(--t-accent)" strokeWidth={1.2} strokeDasharray="4 3" />
        <text x={PAD.l + 3} y={y(game.target) - 3} fontSize={8.5} fill="var(--t-accent)">
          cieľ {kilo(game.target)}
        </text>

        {series.map((pts, i) => {
          const color = COLORS[i % COLORS.length]
          const d = pts.map((v, r) => `${r ? 'L' : 'M'}${x(r).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
          const lastR = pts.length - 1
          const p = profiles.find((pr) => pr.id === game.playerIds[i])
          const winner = game.playerIds[i] === game.winnerId
          return (
            <g key={i}>
              <motion.path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={winner ? 3 : 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={{
                  hidden: { pathLength: 0 },
                  show: { pathLength: 1, transition: { duration: 1.4, delay: delay + i * 0.15, ease: 'easeInOut' } },
                }}
              />
              {/* veľké ťahy 1 000+ ako bodky */}
              {pts.map((v, r) =>
                r > 0 && v - pts[r - 1] >= 1000 ? (
                  <motion.circle
                    key={r}
                    cx={x(r)}
                    cy={y(v)}
                    r={2.6}
                    fill={color}
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { delay: delay + i * 0.15 + (r / Math.max(1, lastR)) * 1.4 } },
                    }}
                  />
                ) : null,
              )}
              <motion.text
                x={x(lastR) + 4}
                y={labelY[i] + 4}
                fontSize={12}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: delay + 1.3 + i * 0.15 } } }}
              >
                {p?.avatar ?? '❔'}
              </motion.text>
            </g>
          )
        })}
      </motion.svg>
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 px-2 text-xs">
        {game.playerIds.map((id, i) => {
          const p = profiles.find((pr) => pr.id === id)
          return (
            <span key={id} className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-4 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {p?.name ?? '?'} <span className="tabular text-muted">{fmt(series[i][series[i].length - 1])}</span>
            </span>
          )
        })}
      </div>
      <div className="mt-1 text-center text-[10px] text-muted">vodorovne kolá · bodka = ťah nad 1 000</div>
    </div>
  )
}
