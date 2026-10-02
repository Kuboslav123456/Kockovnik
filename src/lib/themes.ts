import type { ThemeId } from './types'

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  /** CSS background celej obrazovky */
  background: string
  /** voliteľná textúra nad pozadím */
  overlay?: string
  vars: {
    '--t-accent': string
    '--t-accent2': string
    '--t-surface': string
    '--t-surface-strong': string
    '--t-border': string
    '--t-text': string
    '--t-muted': string
    '--t-glow': string
    '--t-on-accent': string
  }
  decor?: 'stars' | 'embers' | 'grid'
}

export const THEMES: Record<ThemeId, Theme> = {
  wood: {
    id: 'wood',
    name: 'Tmavé drevo',
    emoji: '🪵',
    background:
      'radial-gradient(120% 80% at 50% 0%, #4a2e1b 0%, #24160d 55%, #120a05 100%)',
    overlay:
      'repeating-linear-gradient(92deg, rgba(255,220,180,0.035) 0px, rgba(255,220,180,0.035) 2px, transparent 2px, transparent 9px), repeating-linear-gradient(88deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 23px)',
    vars: {
      '--t-accent': '#f5a524',
      '--t-accent2': '#ff7a45',
      '--t-surface': 'rgba(255, 236, 214, 0.07)',
      '--t-surface-strong': 'rgba(255, 236, 214, 0.13)',
      '--t-border': 'rgba(255, 220, 180, 0.14)',
      '--t-text': '#fff4e6',
      '--t-muted': 'rgba(255, 236, 214, 0.6)',
      '--t-glow': 'rgba(245, 165, 36, 0.35)',
      '--t-on-accent': '#2a1606',
    },
  },
  casino: {
    id: 'casino',
    name: 'Kasíno',
    emoji: '🃏',
    background:
      'radial-gradient(110% 75% at 50% 35%, #12784a 0%, #0a4a2d 55%, #04261a 100%)',
    overlay:
      'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
    vars: {
      '--t-accent': '#f6c453',
      '--t-accent2': '#e8a33b',
      '--t-surface': 'rgba(0, 20, 10, 0.32)',
      '--t-surface-strong': 'rgba(0, 20, 10, 0.5)',
      '--t-border': 'rgba(246, 196, 83, 0.28)',
      '--t-text': '#fbf6e4',
      '--t-muted': 'rgba(251, 246, 228, 0.62)',
      '--t-glow': 'rgba(246, 196, 83, 0.4)',
      '--t-on-accent': '#2b1d02',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neón',
    emoji: '💜',
    background:
      'radial-gradient(90% 60% at 20% 0%, #3b0a5c 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #062f4f 0%, transparent 60%), #07040f',
    vars: {
      '--t-accent': '#ff3df2',
      '--t-accent2': '#22e4ff',
      '--t-surface': 'rgba(20, 8, 40, 0.55)',
      '--t-surface-strong': 'rgba(40, 14, 70, 0.7)',
      '--t-border': 'rgba(255, 61, 242, 0.45)',
      '--t-text': '#f6f0ff',
      '--t-muted': 'rgba(220, 205, 255, 0.62)',
      '--t-glow': 'rgba(255, 61, 242, 0.6)',
      '--t-on-accent': '#1a0220',
    },
    decor: 'grid',
  },
  space: {
    id: 'space',
    name: 'Vesmír',
    emoji: '🪐',
    background:
      'radial-gradient(70% 50% at 80% 10%, rgba(99, 70, 255, 0.45) 0%, transparent 70%), radial-gradient(60% 40% at 0% 80%, rgba(0, 180, 255, 0.25) 0%, transparent 70%), linear-gradient(180deg, #050816 0%, #0b1033 100%)',
    vars: {
      '--t-accent': '#8b7bff',
      '--t-accent2': '#3fd0ff',
      '--t-surface': 'rgba(140, 160, 255, 0.08)',
      '--t-surface-strong': 'rgba(140, 160, 255, 0.15)',
      '--t-border': 'rgba(160, 175, 255, 0.22)',
      '--t-text': '#eef1ff',
      '--t-muted': 'rgba(210, 218, 255, 0.6)',
      '--t-glow': 'rgba(139, 123, 255, 0.5)',
      '--t-on-accent': '#0b0730',
    },
    decor: 'stars',
  },
  dragon: {
    id: 'dragon',
    name: 'Drak',
    emoji: '🐉',
    background:
      'radial-gradient(100% 60% at 50% 110%, #b3200e 0%, #5a0b07 40%, transparent 75%), radial-gradient(80% 50% at 50% -10%, #3a0a04 0%, transparent 70%), #120303',
    overlay:
      'repeating-linear-gradient(135deg, rgba(255,140,60,0.04) 0 2px, transparent 2px 14px), repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 14px)',
    vars: {
      '--t-accent': '#ff6a1f',
      '--t-accent2': '#ffd23f',
      '--t-surface': 'rgba(40, 5, 2, 0.5)',
      '--t-surface-strong': 'rgba(70, 10, 4, 0.65)',
      '--t-border': 'rgba(255, 120, 50, 0.35)',
      '--t-text': '#fff1e8',
      '--t-muted': 'rgba(255, 215, 195, 0.62)',
      '--t-glow': 'rgba(255, 106, 31, 0.55)',
      '--t-on-accent': '#2a0700',
    },
    decor: 'embers',
  },
}

export const THEME_ORDER: ThemeId[] = ['wood', 'casino', 'neon', 'space', 'dragon']
