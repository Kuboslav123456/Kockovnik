export type ThemeId = 'wood' | 'casino' | 'neon' | 'space' | 'dragon'
export type EffectId = 'confetti' | 'fireworks' | 'goldrain'

export interface Profile {
  id: string
  name: string
  avatar: string
  xp: number
  achievements: string[]
  themeId: ThemeId
  titleId: string | null
  effectId: EffectId
  diceBackground: boolean
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
  version: 1
  profiles: Profile[]
  activeGame: ActiveGame | null
  history: FinishedGame[]
  settings: Settings
  lastResult: GameResult | null
}
