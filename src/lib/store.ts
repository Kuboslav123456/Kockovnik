import { useSyncExternalStore } from 'react'
import type { ActiveGame, AppState, FinishedGame, GameResult, GameRules, PlayerResult, Profile, Settings, XpLine } from './types'
import { deriveGame, wasLastAtSomePoint } from './game'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, ACHIEVEMENT_XP, levelFromXp, REWARDS } from './progression'

const KEY = 'kockovnik:v1'

const initial: AppState = {
  version: 1,
  profiles: [],
  activeGame: null,
  history: [],
  settings: { sound: true, vibration: true, menuThemeId: 'wood' },
  lastResult: null,
}

const PROFILE_DEFAULTS: Pick<Profile, 'keypadId' | 'burstId' | 'fontId' | 'soundId'> = {
  keypadId: 'classic',
  burstId: 'float',
  fontId: 'classic',
  soundId: 'classic',
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as AppState
    // staršie profily nemajú nové kozmetické polia
    const profiles = (parsed.profiles ?? []).map((p) => ({ ...PROFILE_DEFAULTS, ...p }))
    return { ...initial, ...parsed, profiles, settings: { ...initial.settings, ...parsed.settings } }
  } catch {
    return initial
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function setState(fn: (s: AppState) => AppState) {
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* úložisko nedostupné – appka beží ďalej v pamäti */
  }
  listeners.forEach((l) => l())
}

export function getState() {
  return state
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9)

// ---------- Profily ----------

export function createProfile(name: string, avatar: string): Profile {
  const p: Profile = {
    id: uid(),
    name: name.trim(),
    avatar,
    xp: 0,
    achievements: [],
    themeId: 'wood',
    titleId: null,
    effectId: 'confetti',
    diceBackground: true,
    keypadId: 'classic',
    burstId: 'float',
    fontId: 'classic',
    soundId: 'classic',
    createdAt: Date.now(),
  }
  setState((s) => ({ ...s, profiles: [...s.profiles, p] }))
  return p
}

export function updateProfile(id: string, patch: Partial<Profile>) {
  setState((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
}

export function deleteProfile(id: string) {
  setState((s) => ({ ...s, profiles: s.profiles.filter((p) => p.id !== id) }))
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

// ---------- Hra ----------

export function startGame(playerIds: string[], target: number, rules: GameRules) {
  const game: ActiveGame = { id: uid(), startedAt: Date.now(), target, rules, playerIds, turns: [] }
  setState((s) => ({ ...s, activeGame: game, lastResult: null }))
}

export function addTurn(points: number) {
  setState((s) => {
    if (!s.activeGame) return s
    const d = deriveGame(s.activeGame)
    if (d.finished) return s
    return {
      ...s,
      activeGame: { ...s.activeGame, turns: [...s.activeGame.turns, { playerId: d.currentPlayerId, points }] },
    }
  })
}

export function undoTurn() {
  setState((s) =>
    s.activeGame && s.activeGame.turns.length
      ? { ...s, activeGame: { ...s.activeGame, turns: s.activeGame.turns.slice(0, -1) } }
      : s,
  )
}

export function abandonGame() {
  setState((s) => ({ ...s, activeGame: null }))
}

/** Uzavrie hru: zapíše do histórie, rozdá XP a achievementy. */
export function finishGame(): GameResult | null {
  const s = state
  const g = s.activeGame
  if (!g) return null
  const d = deriveGame(g)
  if (!d.finished || !d.winnerId) return null

  const finished: FinishedGame = { ...g, finishedAt: Date.now(), winnerId: d.winnerId }
  const history = [...s.history, finished]
  const maxTurn = Math.max(0, ...g.turns.map((t) => t.points))

  const players: PlayerResult[] = g.playerIds.map((pid) => {
    const profile = s.profiles.find((p) => p.id === pid)!
    const lines: XpLine[] = [{ label: 'Účasť v hre', xp: 20 }]
    if (pid === d.winnerId) lines.push({ label: 'Výhra', xp: 100 })
    if (maxTurn > 0 && g.turns.some((t) => t.playerId === pid && t.points === maxTurn))
      lines.push({ label: 'Najvyšší ťah hry', xp: 15 })
    if (pid === d.winnerId && wasLastAtSomePoint(finished, pid)) lines.push({ label: 'Comeback', xp: 30 })

    const newAchievements = ACHIEVEMENTS.filter(
      (a) => !profile.achievements.includes(a.id) && a.check({ game: finished, playerId: pid, history }),
    ).map((a) => a.id)
    newAchievements.forEach((id) => lines.push({ label: `${ACHIEVEMENT_MAP[id].icon} ${ACHIEVEMENT_MAP[id].name}`, xp: ACHIEVEMENT_XP }))

    const gained = lines.reduce((a, l) => a + l.xp, 0)
    return { playerId: pid, xpBefore: profile.xp, xpAfter: profile.xp + gained, lines, newAchievements }
  })

  const result: GameResult = { game: finished, players }
  setState((st) => ({
    ...st,
    history,
    activeGame: null,
    lastResult: result,
    profiles: st.profiles.map((p) => {
      const r = players.find((x) => x.playerId === p.id)
      return r ? { ...p, ...autoEquip(p, r.xpAfter), xp: r.xpAfter, achievements: [...p.achievements, ...r.newAchievements] } : p
    }),
  }))
  return result
}

/** Čerstvo odomknuté veci sa hneď zapnú, aby ich stôl videl už v ďalšej hre. */
function autoEquip(p: Profile, xpAfter: number): Partial<Profile> {
  const from = levelFromXp(p.xp)
  const to = levelFromXp(xpAfter)
  const patch: Partial<Profile> = {}
  REWARDS.filter((r) => r.level > from && r.level <= to).forEach((r) => {
    if (r.kind === 'theme') patch.themeId = r.id
    if (r.kind === 'effect') patch.effectId = r.id
    if (r.kind === 'keypad') patch.keypadId = r.id
    if (r.kind === 'burst') patch.burstId = r.id
    if (r.kind === 'font') patch.fontId = r.id
    if (r.kind === 'sound') patch.soundId = r.id
    if (r.kind === 'title') patch.titleId = r.id
    if (r.kind === 'dice') patch.diceBackground = true
  })
  return patch
}
