import type { ActiveGame, FinishedGame } from './types'

type GameLike = Pick<ActiveGame, 'playerIds' | 'turns' | 'target' | 'rules'>

/**
 * Celý stav hry sa odvodzuje z poľa ťahov – vďaka tomu je "späť" iba odobratie
 * posledného ťahu a hráč na ťahu, kolo aj posledné kolo sa vrátia samé.
 */
export function deriveGame(g: GameLike) {
  const n = g.playerIds.length
  const totals: Record<string, number> = Object.fromEntries(g.playerIds.map((id) => [id, 0]))
  let triggerIndex = -1
  g.turns.forEach((t, i) => {
    totals[t.playerId] += t.points
    if (triggerIndex < 0 && totals[t.playerId] >= g.target) triggerIndex = i
  })

  const endIndex = triggerIndex < 0 ? -1 : g.rules.lastRound ? triggerIndex + n - 1 : triggerIndex
  const finished = triggerIndex >= 0 && g.turns.length - 1 >= endIndex
  const currentPlayerId = g.playerIds[g.turns.length % n]
  const round = Math.floor(g.turns.length / n) + 1
  const finalRound = triggerIndex >= 0 && !finished
  const turnsLeft = finalRound ? endIndex - (g.turns.length - 1) : 0
  const triggeredBy = triggerIndex >= 0 ? g.turns[triggerIndex].playerId : null

  let winnerId: string | null = null
  if (finished) {
    const max = Math.max(...Object.values(totals))
    const tied = g.playerIds.filter((id) => totals[id] === max)
    winnerId = triggeredBy && tied.includes(triggeredBy) ? triggeredBy : tied[0]
  }

  const ranking = [...g.playerIds].sort((a, b) => totals[b] - totals[a])

  return { totals, currentPlayerId, round, finished, finalRound, turnsLeft, triggeredBy, winnerId, ranking }
}

/** Tabuľka ako na papieri: riadok = kolo, stĺpec = hráč */
export function roundTable(g: GameLike) {
  const n = g.playerIds.length
  const rows: { round: number; cells: (number | null)[]; running: (number | null)[] }[] = []
  const running = g.playerIds.map(() => 0)
  g.turns.forEach((t, i) => {
    const r = Math.floor(i / n)
    const col = i % n
    if (!rows[r]) rows[r] = { round: r + 1, cells: g.playerIds.map(() => null), running: g.playerIds.map(() => null) }
    running[col] += t.points
    rows[r].cells[col] = t.points
    rows[r].running[col] = running[col]
  })
  return rows
}

export function wasLastAtSomePoint(game: FinishedGame, playerId: string) {
  const n = game.playerIds.length
  if (n < 2) return false
  const totals: Record<string, number> = Object.fromEntries(game.playerIds.map((id) => [id, 0]))
  for (let i = 0; i < game.turns.length; i++) {
    const t = game.turns[i]
    totals[t.playerId] += t.points
    const roundDone = (i + 1) % n === 0
    const roundNo = (i + 1) / n
    if (roundDone && roundNo >= 2) {
      const mine = totals[playerId]
      if (game.playerIds.every((id) => id === playerId || totals[id] > mine)) return true
    }
  }
  return false
}

export function playerStats(history: FinishedGame[], playerId: string) {
  const games = history.filter((g) => g.playerIds.includes(playerId))
  const wins = games.filter((g) => g.winnerId === playerId).length
  let bestTurn = 0
  let points = 0
  let turns = 0
  let zeros = 0
  games.forEach((g) =>
    g.turns.forEach((t) => {
      if (t.playerId !== playerId) return
      turns++
      points += t.points
      if (t.points === 0) zeros++
      if (t.points > bestTurn) bestTurn = t.points
    }),
  )
  const sorted = [...games].sort((a, b) => b.finishedAt - a.finishedAt)
  let streak = 0
  for (const g of sorted) {
    if (g.winnerId !== playerId) break
    streak++
  }
  return {
    games: games.length,
    wins,
    winRate: games.length ? wins / games.length : 0,
    bestTurn,
    avgTurn: turns ? Math.round(points / turns) : 0,
    zeros,
    streak,
  }
}

/** Vzájomné skóre: koľkokrát vyhral A v hrách, kde hral aj B */
export function headToHead(history: FinishedGame[], a: string, b: string) {
  let aWins = 0
  let bWins = 0
  history.forEach((g) => {
    if (!g.playerIds.includes(a) || !g.playerIds.includes(b)) return
    if (g.winnerId === a) aWins++
    else if (g.winnerId === b) bWins++
  })
  return { aWins, bWins }
}

export const fmt = (n: number) => n.toLocaleString('sk-SK').replace(/ /g, ' ')

export function toRoman(n: number): string {
  if (n <= 0) return String(n)
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, r] of map) while (n >= v) { out += r; n -= v }
  return out
}

/** Ďalšia hra s rovnakou partiou: začína hráč, ktorý bol minule druhý (férové striedanie). */
export function nextStartOrder(playerIds: string[]): string[] {
  return playerIds.length > 1 ? [...playerIds.slice(1), playerIds[0]] : playerIds
}
