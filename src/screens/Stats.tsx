import { motion } from 'framer-motion'
import { useApp } from '../lib/store'
import { deriveGame, fmt, headToHead, playerStats } from '../lib/game'
import { Avatar, Header, PlayerName, Screen, Section, listItem } from '../components/ui'

export function Stats() {
  const app = useApp()
  const players = app.profiles
    .map((p) => ({ p, s: playerStats(app.history, p.id) }))
    .sort((a, b) => b.s.wins - a.s.wins || b.s.winRate - a.s.winRate)

  const allTurns = app.history.flatMap((g) => g.turns)
  const record = allTurns.reduce((a, t) => (t.points > a.points ? t : a), { playerId: '', points: 0 })
  const recordHolder = app.profiles.find((p) => p.id === record.playerId)
  const h2hPlayers = players.filter((x) => x.s.games > 0).map((x) => x.p)

  if (!app.history.length) {
    return (
      <Screen>
        <Header title="Letopisy" />
        <div className="px-6 py-20 text-center text-muted">
          <div className="text-5xl">📊</div>
          <div className="mt-3">Zatiaľ žiadne odohrané hry.</div>
          <div className="text-sm">Dohraj prvú hru a čísla sa objavia tu.</div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen className="safe-bottom pb-8">
      <Header title="Letopisy" />

      <Section>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Tile label="Odohraných hier" value={String(app.history.length)} />
          <Tile label="Zapísaných ťahov" value={fmt(allTurns.length)} />
          <Tile label="Rekordný ťah" value={record.points ? `${recordHolder?.avatar ?? ''} ${fmt(record.points)}` : '–'} />
        </div>
      </Section>

      <Section title="Hráči" className="mt-6">
        <div className="flex flex-col gap-2">
          {players.map(({ p, s }, i) => (
            <motion.div key={p.id} custom={i} variants={listItem} initial="hidden" animate="show" className="themed glass rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <Avatar profile={p} size={40} />
                <PlayerName profile={p} className="flex-1" />
                <div className="text-right">
                  <div className="text-xl font-black">{Math.round(s.winRate * 100)} %</div>
                  <div className="text-[10px] text-muted">úspešnosť</div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-track">
                <motion.div className="bar-fill h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${s.winRate * 100}%` }} transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 60, damping: 16 }} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1 text-center text-sm">
                <Mini label="hry" value={s.games} />
                <Mini label="výhry" value={s.wins} />
                <Mini label="max ťah" value={fmt(s.bestTurn)} />
                <Mini label="priemer" value={fmt(s.avgTurn)} />
                <Mini label="prepadol" value={s.zeros} />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {h2hPlayers.length >= 2 && (
        <Section title="Vzájomné skóre (výhry riadku proti stĺpcu)" className="mt-6">
          <div className="themed glass no-scrollbar overflow-x-auto rounded-3xl p-3">
            <table className="tabular w-full text-center text-sm">
              <thead>
                <tr>
                  <th />
                  {h2hPlayers.map((p) => (
                    <th key={p.id} className="px-1 pb-2 text-xl">
                      {p.avatar}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {h2hPlayers.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="py-2 pr-2 text-left">
                      <span className="text-xl">{a.avatar}</span>
                    </td>
                    {h2hPlayers.map((b) => {
                      if (a.id === b.id) return <td key={b.id} className="text-muted">·</td>
                      const h = headToHead(app.history, a.id, b.id)
                      const lead = h.aWins > h.bWins
                      return (
                        <td key={b.id} className={`py-2 ${lead ? 'font-black text-accent' : h.aWins < h.bWins ? 'text-muted' : ''}`}>
                          {h.aWins}:{h.bWins}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Posledné hry" className="mt-6">
        <div className="flex flex-col gap-2">
          {[...app.history]
            .reverse()
            .slice(0, 12)
            .map((g) => {
              const d = deriveGame(g)
              const w = app.profiles.find((p) => p.id === g.winnerId)
              return (
                <div key={g.id} className="themed glass rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{new Date(g.finishedAt).toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>do {fmt(g.target)}</span>
                  </div>
                  <div className="mt-1 font-semibold">🏆 {w?.name ?? 'zmazaný hráč'}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
                    {d.ranking.map((id) => {
                      const p = app.profiles.find((x) => x.id === id)
                      return (
                        <span key={id} className="tabular">
                          {p?.avatar ?? '❔'} {fmt(d.totals[id])}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </Section>
    </Screen>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="themed glass rounded-2xl px-2 py-3">
      <div className="tabular truncate text-lg font-black">{value}</div>
      <div className="text-[10px] leading-tight text-muted">{label}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-bold">{value}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  )
}
