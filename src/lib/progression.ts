import type { EffectId, FinishedGame, Profile, ThemeId } from './types'
import { THEMES } from './themes'
import { playerStats, wasLastAtSomePoint } from './game'

// ---------- Úrovne ----------

export const MAX_LEVEL = 20

/** Celkové XP potrebné na dosiahnutie úrovne (úroveň 1 = 0 XP). Prvá výhra = úroveň 2. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return 15 * (level - 1) * (level + 4)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++
  return level
}

/** Postup v rámci aktuálnej úrovne 0..1 */
export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  if (level >= MAX_LEVEL) return { level, current: 0, needed: 0, ratio: 1 }
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, current: xp - base, needed: next - base, ratio: (xp - base) / (next - base) }
}

// ---------- Odmeny ----------

export const BASE_AVATARS = ['🎲', '😎', '🦊', '🐻', '🐸', '🤠', '🐱', '🐶']

export const AVATAR_PACKS: Record<string, string[]> = {
  pack1: ['🦄', '🦉', '🐼', '🦁'],
  pack2: ['🤖', '👽', '🧙', '🥷'],
  pack3: ['🐲', '👑', '💀', '🧛'],
}

export const TITLES: Record<string, string> = {
  noble: 'Kockový šľachtic',
  master: 'Pán kociek',
  mage: 'Kockový mág',
  legend: 'Legenda stola',
}

export const EFFECTS: Record<EffectId, { name: string; icon: string }> = {
  confetti: { name: 'Konfety', icon: '🎊' },
  fireworks: { name: 'Ohňostroj', icon: '🎆' },
  goldrain: { name: 'Zlatý dážď', icon: '🪙' },
}

export type Reward =
  | { level: number; kind: 'theme'; id: ThemeId; name: string; icon: string; desc: string }
  | { level: number; kind: 'avatars'; id: string; name: string; icon: string; desc: string }
  | { level: number; kind: 'effect'; id: EffectId; name: string; icon: string; desc: string }
  | { level: number; kind: 'title'; id: string; name: string; icon: string; desc: string }
  | { level: number; kind: 'dice'; id: 'dice'; name: string; icon: string; desc: string }
  | { level: number; kind: 'frame'; id: 'gold'; name: string; icon: string; desc: string }

const theme = (level: number, id: ThemeId, desc: string): Reward => ({
  level, kind: 'theme', id, name: `Téma ${THEMES[id].name}`, icon: THEMES[id].emoji, desc,
})
const avatars = (level: number, id: string): Reward => ({
  level, kind: 'avatars', id, name: 'Nové avatary', icon: AVATAR_PACKS[id][0], desc: AVATAR_PACKS[id].join(' '),
})
const title = (level: number, id: string): Reward => ({
  level, kind: 'title', id, name: `Titul „${TITLES[id]}“`, icon: '🏷️', desc: 'Zobrazí sa pri tvojom mene',
})

export const REWARDS: Reward[] = [
  theme(1, 'wood', 'Klasický stôl z tmavého dreva'),
  avatars(2, 'pack1'),
  theme(3, 'casino', 'Zelené sukno a zlaté akcenty'),
  { level: 4, kind: 'effect', id: 'fireworks', name: 'Efekt: Ohňostroj', icon: '🎆', desc: 'Tvoje víťazstvo rozžiari oblohu' },
  title(5, 'noble'),
  theme(6, 'neon', 'Tma a svietiace okraje'),
  avatars(7, 'pack2'),
  { level: 8, kind: 'dice', id: 'dice', name: 'Kocky v pozadí', icon: '🎲', desc: 'Počas tvojho ťahu poletujú kocky' },
  { level: 9, kind: 'effect', id: 'goldrain', name: 'Efekt: Zlatý dážď', icon: '🪙', desc: 'Pri výhre prší zlato' },
  theme(10, 'space', 'Hviezdy, planéty, nekonečno'),
  title(10, 'master'),
  title(12, 'mage'),
  avatars(13, 'pack3'),
  { level: 15, kind: 'frame', id: 'gold', name: 'Zlatý rámik', icon: '🖼️', desc: 'Žiarivý rámik okolo avatara' },
  title(18, 'legend'),
  theme(20, 'dragon', 'Legendárna téma pre skutočných pánov kociek'),
]

export function rewardsUpTo(level: number) {
  return REWARDS.filter((r) => r.level <= level)
}

export function unlockedFor(profile: Profile) {
  const level = levelFromXp(profile.xp)
  const got = rewardsUpTo(level)
  const avatars = [...BASE_AVATARS]
  got.forEach((r) => r.kind === 'avatars' && avatars.push(...AVATAR_PACKS[r.id]))
  return {
    level,
    themes: got.filter((r) => r.kind === 'theme').map((r) => r.id as ThemeId),
    titles: got.filter((r) => r.kind === 'title').map((r) => r.id),
    effects: ['confetti' as EffectId, ...got.filter((r) => r.kind === 'effect').map((r) => r.id as EffectId)],
    avatars,
    dice: got.some((r) => r.kind === 'dice'),
    frame: got.some((r) => r.kind === 'frame'),
  }
}

/** Témy, ktoré si niekto zo stola už odomkol (pre menu) */
export function themesUnlockedByAnyone(profiles: Profile[]): ThemeId[] {
  const set = new Set<ThemeId>(['wood'])
  profiles.forEach((p) => unlockedFor(p).themes.forEach((t) => set.add(t)))
  return [...set]
}

// ---------- Achievementy ----------

export interface AchievementCtx {
  game: FinishedGame
  playerId: string
  /** história vrátane práve skončenej hry */
  history: FinishedGame[]
}

export interface Achievement {
  id: string
  name: string
  icon: string
  desc: string
  hidden?: boolean
  check: (c: AchievementCtx) => boolean
}

export const ACHIEVEMENT_XP = 25

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win', name: 'Prvá krv', icon: '🩸', desc: 'Vyhraj svoju prvú hru',
    check: (c) => c.game.winnerId === c.playerId,
  },
  {
    id: 'thousand', name: 'Tisícovka', icon: '💥', desc: 'Zapíš ťah za 1 000 a viac bodov',
    check: (c) => c.game.turns.some((t) => t.playerId === c.playerId && t.points >= 1000),
  },
  {
    id: 'unlucky', name: 'Smoliar', icon: '🌧️', desc: 'Prepadni 3× za sebou v jednej hre',
    check: (c) => {
      let streak = 0
      for (const t of c.game.turns) {
        if (t.playerId !== c.playerId) continue
        streak = t.points === 0 ? streak + 1 : 0
        if (streak >= 3) return true
      }
      return false
    },
  },
  {
    id: 'comeback', name: 'Comeback kid', icon: '🔄', desc: 'Vyhraj hru z posledného miesta',
    check: (c) => c.game.winnerId === c.playerId && wasLastAtSomePoint(c.game, c.playerId),
  },
  {
    id: 'unbeatable', name: 'Neporaziteľný', icon: '🛡️', desc: 'Vyhraj 3 hry za sebou',
    check: (c) => playerStats(c.history, c.playerId).streak >= 3,
  },
  {
    id: 'marathon', name: 'Maratónec', icon: '🏃', desc: 'Odohraj 25 hier',
    check: (c) => playerStats(c.history, c.playerId).games >= 25,
  },
  {
    id: 'sniper', name: 'Ostrostrelec', icon: '🎯', hidden: true,
    desc: 'Vyhraj s presne cieľovým počtom bodov',
    check: (c) => {
      if (c.game.winnerId !== c.playerId) return false
      const total = c.game.turns.filter((t) => t.playerId === c.playerId).reduce((a, t) => a + t.points, 0)
      return total === c.game.target
    },
  },
  {
    id: 'nightowl', name: 'Nočná sova', icon: '🦉', hidden: true,
    desc: 'Dohraj hru medzi polnocou a štvrtou ráno',
    check: (c) => {
      const h = new Date(c.game.finishedAt).getHours()
      return h >= 0 && h < 4
    },
  },
  {
    id: 'blitz', name: 'Blesk', icon: '⚡', hidden: true,
    desc: 'Vyhraj na extrémne málo ťahov',
    check: (c) => {
      if (c.game.winnerId !== c.playerId || c.game.target < 5000) return false
      const own = c.game.turns.filter((t) => t.playerId === c.playerId).length
      return own <= Math.max(2, Math.ceil(c.game.target / 1250))
    },
  },
]

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
