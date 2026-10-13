// Komentátor: krátka hláška k poslednému ťahu a k situácii v hre.
// Všetko sa odvodzuje z ťahov, takže po „Späť“ sa vráti aj predchádzajúca hláška.

import { deriveGame, fmt } from './game'
import type { ActiveGame, Gender } from './types'

type Who = { name: string; gender?: Gender | null }

/** tvar slovesa podľa rodu; bez uvedeného rodu neutrálna náhrada (prítomný čas) */
const g = (p: Who, m: string, f: string, n = m) => (p.gender === 'f' ? f : p.gender === 'm' ? m : n)

/** stabilný „náhodný“ výber – pri prekreslení sa hláška nemení */
const pick = <T>(list: T[], seed: number) => list[seed % list.length]

export function commentary(game: ActiveGame, who: (id: string) => Who): string | null {
  const n = game.playerIds.length
  const turns = game.turns
  if (!turns.length) return null

  const now = deriveGame(game)
  if (now.finished) return null
  const before = deriveGame({ ...game, turns: turns.slice(0, -1) })

  const last = turns[turns.length - 1]
  const p = who(last.playerId)
  const pts = last.points
  const total = now.totals[last.playerId]
  const seed = turns.length
  const next = who(now.currentPlayerId)

  const leaderOf = (d: typeof now) => {
    const [a, b] = d.ranking
    return b && d.totals[a] === d.totals[b] ? null : a
  }
  const leadNow = leaderOf(now)
  const leadBefore = leaderOf(before)

  // ---- posledné kolo ----
  if (now.finalRound) {
    if (now.triggeredBy === last.playerId && !before.finalRound) {
      return game.rules.lastRound && n > 1
        ? `⚔️ ${p.name} ${g(p, 'prekročil', 'prekročila', 'prekračuje')} ${fmt(game.target)}! Ostatní majú posledný pokus.`
        : `⚔️ ${p.name} ${g(p, 'prekročil', 'prekročila', 'prekračuje')} ${fmt(game.target)}!`
    }
    if (leadNow === last.playerId && leadBefore !== last.playerId) {
      return `😱 ${p.name} ${g(p, 'ukradol', 'ukradla', 'kradne')} vedenie na poslednú chvíľu!`
    }
    const leader = who(now.ranking[0])
    const need = now.totals[now.ranking[0]] - now.totals[now.currentPlayerId] + 50
    if (now.currentPlayerId !== now.ranking[0] && need > 0) {
      if (need >= 5000) return `🙏 ${next.name} potrebuje zázrak – aspoň ${fmt(need)} v jednom ťahu.`
      return now.turnsLeft === 1
        ? `🕯️ Posledný pokus: ${next.name} potrebuje aspoň ${fmt(need)}, inak vyhráva ${leader.name}.`
        : `🕯️ Na ťahu ${next.name} – na vedenie treba aspoň ${fmt(need)}.`
    }
    return null
  }

  // ---- prepadnutia ----
  if (pts === 0) {
    const mine = turns.filter((t) => t.playerId === last.playerId)
    let streak = 0
    for (let i = mine.length - 1; i >= 0 && mine[i].points === 0; i--) streak++
    if (streak >= 3)
      return `💀 ${p.name}: ${streak}. prepadnutie za sebou! Kocky ${g(p, 'ho dnes nemajú rady', 'ju dnes nemajú rady', 'sa dnes hnevajú')}.`
    if (streak === 2) return `😬 ${p.name} znova nič. Druhé prepadnutie za sebou.`
    return pick(
      [
        `Ticho pri stole. ${p.name} nič.`,
        `Kocky dnes ${p.name} nepriali.`,
        `${p.name} odchádza naprázdno.`,
        `Škoda, ${p.name}. Nabudúce to padne.`,
      ],
      seed,
    )
  }

  // ---- veľké ťahy ----
  if (pts >= 5000) return `💥 ${p.name} ${g(p, 'odpálil', 'odpálila', 'odpaľuje')} ${fmt(pts)}! To sa zapíše do letopisov.`
  const bestBefore = Math.max(0, ...turns.slice(0, -1).map((t) => t.points))
  if (pts >= 1000 && pts > bestBefore && turns.length > n)
    return `🔥 ${fmt(pts)}! Najvyšší ťah tejto hry ${g(p, 'hodil', 'hodila', 'má')} ${p.name}.`

  // ---- poradie ----
  if (n > 1 && leadNow === last.playerId && leadBefore !== last.playerId && turns.length > n) {
    const passed = leadBefore ? who(leadBefore) : null
    // mená neskloňujeme (Kuboslav → Kuboslava by appka nevedela), preto len 1. pád
    return passed
      ? `👑 Zmena na čele! Vedie ${p.name}, ${passed.name} klesá na 2. miesto.`
      : `👑 ${p.name} sa ujíma vedenia!`
  }
  if (n > 2 && before.ranking[n - 1] === last.playerId && now.ranking[n - 1] !== last.playerId && turns.length > n * 2)
    return `🧗 ${p.name} sa ${g(p, 'odlepil', 'odlepila', 'odlepuje')} od dna.`

  // ---- blízko cieľa ----
  const toGo = game.target - total
  if (toGo > 0 && toGo <= 1000) return `🎯 ${p.name}: už len ${fmt(toGo)} do víťazstva!`

  if (pts >= 1000) return pick([`✨ Pekný hod, ${p.name}!`, `✨ ${fmt(pts)}! ${p.name} sa nedá zastaviť.`, `✨ To bol hod, ${p.name}!`], seed)

  // ---- súboj ----
  if (n > 1 && now.round >= 3) {
    const [a, b] = now.ranking
    const diff = now.totals[a] - now.totals[b]
    if (diff > 0 && diff <= 300) return `⚖️ Tesný súboj! ${who(a).name} a ${who(b).name} delí len ${fmt(diff)}.`
    if (diff >= 3000) return `🏃 ${who(a).name} uteká ostatným o ${fmt(diff)}.`
  }

  return null
}
