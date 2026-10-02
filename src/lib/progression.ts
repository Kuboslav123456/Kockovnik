import type { BurstId, EffectId, FinishedGame, FontId, KeypadId, Profile, SoundId, ThemeId } from './types'
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

/** Vzhľad klávesnice – vidia ho všetci, keď je hráč na ťahu */
export const KEYPADS: Record<KeypadId, { name: string; icon: string; desc: string }> = {
  classic: { name: 'Klasická', icon: '⌨️', desc: 'Sklenené tlačidlá' },
  dice: { name: 'Kockové klávesy', icon: '🎲', desc: 'Klávesy ako slonovinové kocky' },
  neon: { name: 'Neónová', icon: '💡', desc: 'Svietiace obrysy v tme' },
  gold: { name: 'Zlatá', icon: '🥇', desc: 'Klávesy z rýdzeho zlata' },
}

/** Čo sa stane po zapísaní bodov */
export const BURSTS: Record<BurstId, { name: string; icon: string; desc: string }> = {
  float: { name: 'Vyletenie', icon: '🎈', desc: 'Body vyletia nad kartu' },
  explode: { name: 'Explózia', icon: '💥', desc: 'Body vybuchnú do iskier' },
  lightning: { name: 'Blesk', icon: '⚡', desc: 'Zablýska sa a stôl sa otrasie' },
  fire: { name: 'Dračí oheň', icon: '🔥', desc: 'Body vzplanú plameňmi' },
}

/** Písmo, ktorým sa zobrazuje skóre hráča */
export const FONTS: Record<FontId, { name: string; icon: string; desc: string; className: string }> = {
  classic: { name: 'Klasické', icon: '🔢', desc: 'Čisté a čitateľné', className: '' },
  chalk: { name: 'Krieda', icon: '🖍️', desc: 'Ako ručne na papieri', className: 'score-chalk' },
  led: { name: 'Digitálne', icon: '📟', desc: 'Svietiaci displej', className: 'score-led' },
}

/** Zvukový balíček počas ťahu */
export const SOUNDS: Record<SoundId, { name: string; icon: string; desc: string }> = {
  classic: { name: 'Klasické', icon: '🔔', desc: 'Jemné cinknutia' },
  retro: { name: '8-bit', icon: '👾', desc: 'Zvuky starých automatov' },
  casino: { name: 'Kasíno', icon: '🎰', desc: 'Cinkot mincí a žetónov' },
}

type R<K extends string, I extends string> = { level: number; kind: K; id: I; name: string; icon: string; desc: string }
export type Reward =
  | R<'theme', ThemeId>
  | R<'avatars', string>
  | R<'effect', EffectId>
  | R<'title', string>
  | R<'dice', 'dice'>
  | R<'frame', 'gold'>
  | R<'keypad', KeypadId>
  | R<'burst', BurstId>
  | R<'font', FontId>
  | R<'sound', SoundId>

export const KIND_LABEL: Record<Reward['kind'], string> = {
  theme: 'Téma stola',
  avatars: 'Avatary',
  effect: 'Efekt víťazstva',
  title: 'Titul',
  dice: 'Pozadie',
  frame: 'Rámik',
  keypad: 'Klávesnica',
  burst: 'Animácia bodov',
  font: 'Písmo čísel',
  sound: 'Zvuky',
}

const theme = (level: number, id: ThemeId, desc: string): Reward => ({
  level, kind: 'theme', id, name: `Téma ${THEMES[id].name}`, icon: THEMES[id].emoji, desc,
})
const avatars = (level: number, id: string): Reward => ({
  level, kind: 'avatars', id, name: 'Nové avatary', icon: AVATAR_PACKS[id][0], desc: AVATAR_PACKS[id].join(' '),
})
const title = (level: number, id: string): Reward => ({
  level, kind: 'title', id, name: `Titul „${TITLES[id]}“`, icon: '🏷️', desc: 'Zobrazí sa pri tvojom mene',
})
const keypad = (level: number, id: KeypadId): Reward => ({ level, kind: 'keypad', id, name: `Klávesnica: ${KEYPADS[id].name}`, icon: KEYPADS[id].icon, desc: KEYPADS[id].desc })
const burst = (level: number, id: BurstId): Reward => ({ level, kind: 'burst', id, name: `Animácia: ${BURSTS[id].name}`, icon: BURSTS[id].icon, desc: BURSTS[id].desc })
const font = (level: number, id: FontId): Reward => ({ level, kind: 'font', id, name: `Písmo: ${FONTS[id].name}`, icon: FONTS[id].icon, desc: FONTS[id].desc })
const sound = (level: number, id: SoundId): Reward => ({ level, kind: 'sound', id, name: `Zvuky: ${SOUNDS[id].name}`, icon: SOUNDS[id].icon, desc: SOUNDS[id].desc })

/** Cesta odmien – každá úroveň niečo odomyká, väčšina sa prejaví počas ťahu hráča. */
export const REWARDS: Reward[] = [
  theme(1, 'manuscript', 'Pergamen, gotické iniciály a zlato'),
  theme(1, 'wood', 'Klasický stôl z tmavého dreva'),
  avatars(2, 'pack1'),
  theme(3, 'casino', 'Zelené sukno a zlaté akcenty'),
  keypad(4, 'dice'),
  title(4, 'noble'),
  { level: 5, kind: 'effect', id: 'fireworks', name: 'Efekt: Ohňostroj', icon: '🎆', desc: 'Tvoje víťazstvo rozžiari oblohu' },
  burst(6, 'explode'),
  theme(7, 'neon', 'Tma a svietiace okraje'),
  { level: 8, kind: 'dice', id: 'dice', name: 'Kocky v pozadí', icon: '🎲', desc: 'Počas tvojho ťahu poletujú kocky' },
  font(9, 'chalk'),
  theme(10, 'space', 'Hviezdy, planéty, nekonečno'),
  title(10, 'master'),
  sound(11, 'retro'),
  keypad(12, 'neon'),
  avatars(13, 'pack2'),
  burst(14, 'lightning'),
  { level: 15, kind: 'frame', id: 'gold', name: 'Zlatý rámik', icon: '🖼️', desc: 'Žiarivý rámik okolo avatara' },
  title(15, 'mage'),
  font(16, 'led'),
  { level: 17, kind: 'effect', id: 'goldrain', name: 'Efekt: Zlatý dážď', icon: '🪙', desc: 'Pri výhre prší zlato' },
  keypad(18, 'gold'),
  title(18, 'legend'),
  avatars(19, 'pack3'),
  sound(19, 'casino'),
  theme(20, 'dragon', 'Legendárna téma pre skutočných pánov kociek'),
  burst(20, 'fire'),
]

export function rewardsUpTo(level: number) {
  return REWARDS.filter((r) => r.level <= level)
}

export function unlockedFor(profile: Pick<Profile, 'xp'>) {
  const level = levelFromXp(profile.xp)
  const got = rewardsUpTo(level)
  const ids = <K extends Reward['kind']>(kind: K) =>
    got.filter((r) => r.kind === kind).map((r) => r.id) as Extract<Reward, { kind: K }>['id'][]
  const avatars = [...BASE_AVATARS]
  ids('avatars').forEach((id) => avatars.push(...AVATAR_PACKS[id]))
  return {
    level,
    themes: ids('theme'),
    titles: ids('title'),
    effects: ['confetti' as EffectId, ...ids('effect')],
    keypads: ['classic' as KeypadId, ...ids('keypad')],
    bursts: ['float' as BurstId, ...ids('burst')],
    fonts: ['classic' as FontId, ...ids('font')],
    sounds: ['classic' as SoundId, ...ids('sound')],
    avatars,
    dice: got.some((r) => r.kind === 'dice'),
    frame: got.some((r) => r.kind === 'frame'),
  }
}

/** Čo hráč reálne používa – ak má zvolené niečo, čo nemá odomknuté, použije sa základ. */
export function cosmetics(profile: Profile | undefined) {
  const base = {
    themeId: 'manuscript' as ThemeId,
    effectId: 'confetti' as EffectId,
    keypadId: 'classic' as KeypadId,
    burstId: 'float' as BurstId,
    fontId: 'classic' as FontId,
    soundId: 'classic' as SoundId,
    dice: false,
    titleId: null as string | null,
  }
  if (!profile) return base
  const u = unlockedFor(profile)
  const pick = <T,>(sel: T | undefined, list: T[], def: T) => (sel !== undefined && list.includes(sel) ? sel : def)
  return {
    themeId: pick(profile.themeId, u.themes, base.themeId),
    effectId: pick(profile.effectId, u.effects, base.effectId),
    keypadId: pick(profile.keypadId, u.keypads, base.keypadId),
    burstId: pick(profile.burstId, u.bursts, base.burstId),
    fontId: pick(profile.fontId, u.fonts, base.fontId),
    soundId: pick(profile.soundId, u.sounds, base.soundId),
    dice: u.dice && profile.diceBackground,
    titleId: profile.titleId && u.titles.includes(profile.titleId) ? profile.titleId : null,
  }
}

/** Témy, ktoré si niekto zo stola už odomkol (pre menu) */
export function themesUnlockedByAnyone(profiles: Profile[]): ThemeId[] {
  const set = new Set<ThemeId>(['manuscript', 'wood'])
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
