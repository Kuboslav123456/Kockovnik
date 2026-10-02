export type ThemeId = 'manuscript' | 'wood' | 'casino' | 'neon' | 'space' | 'dragon'
export type Gender = 'f' | 'm'
export type EffectId = 'confetti' | 'fireworks' | 'goldrain'
export type KeypadId = 'classic' | 'dice' | 'neon' | 'gold'
export type BurstId = 'float' | 'explode' | 'lightning' | 'fire'
export type FontId = 'classic' | 'chalk' | 'led'
export type SoundId = 'classic' | 'retro' | 'casino'

export interface Profile {
  id: string
  name: string
  avatar: string
  /** len kvôli správnemu tvaru slovies („hodila“ / „hodil“); nepovinné */
  gender?: Gender | null
  xp: number
  achievements: string[]
  themeId: ThemeId
  titleId: string | null
  effectId: EffectId
  diceBackground: boolean
  keypadId: KeypadId
  burstId: BurstId
  fontId: FontId
  soundId: SoundId
  createdAt: number
}

export interface Turn {
  playerId: string
  points: number
}

export interface GameRules {
  lastRound: boolean
  minEntry: number
}

export interface ActiveGame {
  id: string
  startedAt: number
  target: number
  rules: GameRules
  playerIds: string[]
  turns: Turn[]
}

export interface FinishedGame {
  id: string
  startedAt: number
  finishedAt: number
  target: number
  rules: GameRules
  playerIds: string[]
  turns: Turn[]
  winnerId: string
}

export interface Settings {
  sound: boolean
  vibration: boolean
  menuThemeId: ThemeId
  /** klávesy 1–3 ako I, II, III */
  romanKeys: boolean
}

export interface XpLine {
  label: string
  xp: number
}

export interface PlayerResult {
  playerId: string
  xpBefore: number
  xpAfter: number
  lines: XpLine[]
  newAchievements: string[]
}

export interface GameResult {
  game: FinishedGame
  players: PlayerResult[]
}

export interface AppState {
  version: 1 | 2
  profiles: Profile[]
  activeGame: ActiveGame | null
  history: FinishedGame[]
  settings: Settings
  lastResult: GameResult | null
}
