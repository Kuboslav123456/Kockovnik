export type ThemeId = 'manuscript' | 'wood' | 'casino' | 'neon' | 'space' | 'dragon'
export type Gender = 'f' | 'm'
export type EffectId = 'confetti' | 'fireworks' | 'goldrain'
export type KeypadId = 'classic' | 'dice' | 'neon' | 'gold'
export type BurstId = 'float' | 'explode' | 'lightning' | 'fire'
export type FontId = 'classic' | 'chalk' | 'led'
export type SoundId = 'medieval' | 'classic' | 'retro' | 'casino'

// ---------- Kováreň: vlastné kocky ----------
export type PipStyle = 'dots' | 'diamonds' | 'stars' | 'roman'
export type EmblemKind = 'none' | 'initial' | 'avatar'
export type ForgeEffect = 'none' | 'shine' | 'pipglow' | 'glow' | 'sparkle'
export type ForgeQuality = 'apprentice' | 'journeyman' | 'master'

export interface ForgeSpec {
  material: string
  tint: string
  pipColor: string
  pipStyle: PipStyle
  emblem: EmblemKind
  effect: ForgeEffect
}

export interface CustomDie extends ForgeSpec {
  /** vždy začína „c_“, aby sa nemiešalo s kockami z Klenotnice */
  id: string
  name: string
  quality: ForgeQuality
  /** iniciála alebo avatar vyrytý na jednotke v čase kovania */
  emblemText?: string
  createdAt: number
}

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
  /** Klenotnica: id kocky → počet kusov */
  dice: Record<string, number>
  /** mince za duplikáty, na kovanie chýbajúcich kociek */
  coins: number
  /** obľúbená kocka – ukazuje sa počas ťahu hráča */
  favoriteDie: string | null
  /** sady kociek, za ktoré už hráč dostal odmenu */
  setsDone: string[]
  /** vlastné kocky z kovárne */
  custom: CustomDie[]
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

export interface ChestResult {
  tier: 'wood' | 'iron' | 'gold'
  dieId: string
  /** nová kocka do zbierky (inak duplikát premenený na mince) */
  isNew: boolean
  /** mince spolu (truhlica + prípadný duplikát) */
  coins: number
  /** sady, ktoré táto kocka dokončila (ich mince sú už v `coins`) */
  completedSets?: string[]
}

export interface PlayerResult {
  playerId: string
  xpBefore: number
  xpAfter: number
  lines: XpLine[]
  newAchievements: string[]
  /** staršie výsledky (pred Klenotnicou) truhlicu nemajú */
  chest?: ChestResult
}

export interface GameResult {
  game: FinishedGame
  players: PlayerResult[]
}

export interface AppState {
  version: 1 | 2 | 3
  profiles: Profile[]
  activeGame: ActiveGame | null
  history: FinishedGame[]
  settings: Settings
  lastResult: GameResult | null
}
