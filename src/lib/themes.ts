import type { ThemeId } from './types'

type Vars = {
  '--t-accent': string
  '--t-accent2': string
  /** svetlejší akcent – vnútorné linky iniciál, koniec progressu */
  '--t-accent3': string
  '--t-surface': string
  '--t-surface-strong': string
  '--t-border': string
  '--t-text': string
  '--t-muted': string
  /** nulové hodnoty, prázdne bunky */
  '--t-faint': string
  '--t-glow': string
  '--t-on-accent': string
  /** podklad progress barov */
  '--t-track': string
  /** oddeľovače riadkov */
  '--t-line': string
  '--t-line-strong': string
  /** pozadie spodného panelu */
  '--t-sheet': string
  /** pozadie textových polí */
  '--t-input': string
  '--t-font-body': string
  '--t-font-display': string
  '--t-font-caps': string
  '--t-display-weight': string
  /** hrúbka kapitálok (tlačidlá, navigácia, labely) */
  '--t-caps-weight': string
}

export interface Theme {
  id: ThemeId
  name: string
  emoji: string
  /** svetlá téma potrebuje iný color-scheme a tmavší text */
  scheme: 'light' | 'dark'
  /** 'manuscript' = ostré rohy, bez rozmazania, linky namiesto kariet */
  style: 'glass' | 'manuscript'
  /** plná farba pod pozadím (overscroll, lišta prehliadača) */
  base: string
  /** CSS background celej obrazovky */
  background: string
  /** voliteľná textúra nad pozadím */
  overlay?: string
  overlaySize?: string
  vignette: boolean
  vars: Vars
  decor?: 'stars' | 'embers' | 'grid'
}

const SANS = "'Rubik Variable', system-ui, sans-serif"
const glassFonts = {
  '--t-font-body': SANS,
  '--t-font-display': SANS,
  '--t-font-caps': SANS,
  '--t-caps-weight': '600',
  '--t-display-weight': '900',
}

// Papierové zrno ako inline SVG šum – žiadny bitmapový asset
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .22 0 0 0 0 .1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export const THEMES: Record<ThemeId, Theme> = {
  manuscript: {
    id: 'manuscript',
    name: 'Rukopis',
    emoji: '📜',
    scheme: 'light',
    style: 'manuscript',
    base: '#e6cf9e',
    background: 'radial-gradient(120% 90% at 50% 40%, #f3e4c2 0%, #e6cf9e 70%, #c9a86a 100%)',
    overlay: PAPER_GRAIN,
    overlaySize: '220px 220px',
    vignette: false,
    vars: {
      '--t-accent': '#9a2a1c',
      '--t-accent2': '#b8892c',
      '--t-accent3': '#e9c66a',
      '--t-surface': 'rgba(154, 42, 28, 0.06)',
      '--t-surface-strong': 'rgba(154, 42, 28, 0.1)',
      '--t-border': 'rgba(43, 29, 18, 0.2)',
      '--t-text': '#2b1d12',
      '--t-muted': '#5a3e24',
      '--t-faint': '#b4a07a',
      '--t-glow': 'rgba(184, 137, 44, 0.35)',
      '--t-on-accent': '#f3e4c2',
      '--t-track': 'rgba(43, 29, 18, 0.15)',
      '--t-line': 'rgba(43, 29, 18, 0.2)',
      '--t-line-strong': 'rgba(43, 29, 18, 0.35)',
      '--t-sheet': '#efdcb4',
      '--t-input': 'rgba(255, 249, 232, 0.55)',
      '--t-font-body': "'IM Fell English', 'EB Garamond', Georgia, serif",
      '--t-font-display': "'IM Fell English', 'EB Garamond', Georgia, serif",
      '--t-font-caps': "'EB Garamond', 'IM Fell English SC', Georgia, serif",
      '--t-caps-weight': '600',
      '--t-display-weight': '400',
    },
  },
  wood: {
    id: 'wood',
    name: 'Tmavé drevo',
    emoji: '🪵',
    scheme: 'dark',
    style: 'glass',
    base: '#120a05',
    background: 'radial-gradient(120% 80% at 50% 0%, #4a2e1b 0%, #24160d 55%, #120a05 100%)',
    overlay:
      'repeating-linear-gradient(92deg, rgba(255,220,180,0.035) 0px, rgba(255,220,180,0.035) 2px, transparent 2px, transparent 9px), repeating-linear-gradient(88deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 23px)',
    vignette: true,
    vars: {
      '--t-accent': '#f5a524',
      '--t-accent2': '#ff7a45',
      '--t-accent3': '#ffd27a',
      '--t-surface': 'rgba(255, 236, 214, 0.07)',
      '--t-surface-strong': 'rgba(255, 236, 214, 0.13)',
      '--t-border': 'rgba(255, 220, 180, 0.14)',
      '--t-text': '#fff4e6',
      '--t-muted': 'rgba(255, 236, 214, 0.6)',
      '--t-faint': 'rgba(255, 236, 214, 0.32)',
      '--t-glow': 'rgba(245, 165, 36, 0.35)',
      '--t-on-accent': '#2a1606',
      '--t-track': 'rgba(0, 0, 0, 0.32)',
      '--t-line': 'rgba(255, 220, 180, 0.12)',
      '--t-line-strong': 'rgba(255, 220, 180, 0.24)',
      '--t-sheet': '#22160e',
      '--t-input': 'rgba(0, 0, 0, 0.25)',
      ...glassFonts,
    },
  },
  casino: {
    id: 'casino',
    name: 'Kasíno',
    emoji: '🃏',
    scheme: 'dark',
    style: 'glass',
    base: '#04261a',
    background: 'radial-gradient(110% 75% at 50% 35%, #12784a 0%, #0a4a2d 55%, #04261a 100%)',
    overlay: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
    overlaySize: '4px 4px',
    vignette: true,
    vars: {
      '--t-accent': '#f6c453',
      '--t-accent2': '#e8a33b',
      '--t-accent3': '#ffe08a',
      '--t-surface': 'rgba(0, 20, 10, 0.32)',
      '--t-surface-strong': 'rgba(0, 20, 10, 0.5)',
      '--t-border': 'rgba(246, 196, 83, 0.28)',
      '--t-text': '#fbf6e4',
      '--t-muted': 'rgba(251, 246, 228, 0.62)',
      '--t-faint': 'rgba(251, 246, 228, 0.32)',
      '--t-glow': 'rgba(246, 196, 83, 0.4)',
      '--t-on-accent': '#2b1d02',
      '--t-track': 'rgba(0, 0, 0, 0.32)',
      '--t-line': 'rgba(246, 196, 83, 0.18)',
      '--t-line-strong': 'rgba(246, 196, 83, 0.32)',
      '--t-sheet': '#073823',
      '--t-input': 'rgba(0, 0, 0, 0.25)',
      ...glassFonts,
    },
  },
  neon: {
    id: 'neon',
    name: 'Neón',
    emoji: '💜',
    scheme: 'dark',
    style: 'glass',
    base: '#07040f',
    background:
      'radial-gradient(90% 60% at 20% 0%, #3b0a5c 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #062f4f 0%, transparent 60%), #07040f',
    vignette: true,
    vars: {
      '--t-accent': '#ff3df2',
      '--t-accent2': '#22e4ff',
      '--t-accent3': '#9ff6ff',
      '--t-surface': 'rgba(20, 8, 40, 0.55)',
      '--t-surface-strong': 'rgba(40, 14, 70, 0.7)',
      '--t-border': 'rgba(255, 61, 242, 0.45)',
      '--t-text': '#f6f0ff',
      '--t-muted': 'rgba(220, 205, 255, 0.62)',
      '--t-faint': 'rgba(220, 205, 255, 0.32)',
      '--t-glow': 'rgba(255, 61, 242, 0.6)',
      '--t-on-accent': '#1a0220',
      '--t-track': 'rgba(0, 0, 0, 0.4)',
      '--t-line': 'rgba(255, 61, 242, 0.25)',
      '--t-line-strong': 'rgba(255, 61, 242, 0.45)',
      '--t-sheet': '#140a24',
      '--t-input': 'rgba(0, 0, 0, 0.35)',
      ...glassFonts,
    },
    decor: 'grid',
  },
  space: {
    id: 'space',
    name: 'Vesmír',
    emoji: '🪐',
    scheme: 'dark',
    style: 'glass',
    base: '#050816',
    background:
      'radial-gradient(70% 50% at 80% 10%, rgba(99, 70, 255, 0.45) 0%, transparent 70%), radial-gradient(60% 40% at 0% 80%, rgba(0, 180, 255, 0.25) 0%, transparent 70%), linear-gradient(180deg, #050816 0%, #0b1033 100%)',
    vignette: true,
    vars: {
      '--t-accent': '#8b7bff',
      '--t-accent2': '#3fd0ff',
      '--t-accent3': '#b9f0ff',
      '--t-surface': 'rgba(140, 160, 255, 0.08)',
      '--t-surface-strong': 'rgba(140, 160, 255, 0.15)',
      '--t-border': 'rgba(160, 175, 255, 0.22)',
      '--t-text': '#eef1ff',
      '--t-muted': 'rgba(210, 218, 255, 0.6)',
      '--t-faint': 'rgba(210, 218, 255, 0.3)',
      '--t-glow': 'rgba(139, 123, 255, 0.5)',
      '--t-on-accent': '#0b0730',
      '--t-track': 'rgba(0, 0, 0, 0.35)',
      '--t-line': 'rgba(160, 175, 255, 0.16)',
      '--t-line-strong': 'rgba(160, 175, 255, 0.3)',
      '--t-sheet': '#0d1236',
      '--t-input': 'rgba(0, 0, 0, 0.3)',
      ...glassFonts,
    },
    decor: 'stars',
  },
  dragon: {
    id: 'dragon',
    name: 'Drak',
    emoji: '🐉',
    scheme: 'dark',
    style: 'glass',
    base: '#120303',
    background:
      'radial-gradient(100% 60% at 50% 110%, #b3200e 0%, #5a0b07 40%, transparent 75%), radial-gradient(80% 50% at 50% -10%, #3a0a04 0%, transparent 70%), #120303',
    overlay:
      'repeating-linear-gradient(135deg, rgba(255,140,60,0.04) 0 2px, transparent 2px 14px), repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 14px)',
    vignette: true,
    vars: {
      '--t-accent': '#ff6a1f',
      '--t-accent2': '#ffd23f',
      '--t-accent3': '#ffe9a0',
      '--t-surface': 'rgba(40, 5, 2, 0.5)',
      '--t-surface-strong': 'rgba(70, 10, 4, 0.65)',
      '--t-border': 'rgba(255, 120, 50, 0.35)',
      '--t-text': '#fff1e8',
      '--t-muted': 'rgba(255, 215, 195, 0.62)',
      '--t-faint': 'rgba(255, 215, 195, 0.32)',
      '--t-glow': 'rgba(255, 106, 31, 0.55)',
      '--t-on-accent': '#2a0700',
      '--t-track': 'rgba(0, 0, 0, 0.4)',
      '--t-line': 'rgba(255, 120, 50, 0.2)',
      '--t-line-strong': 'rgba(255, 120, 50, 0.35)',
      '--t-sheet': '#2a0604',
      '--t-input': 'rgba(0, 0, 0, 0.3)',
      ...glassFonts,
    },
    decor: 'embers',
  },
}

export const THEME_ORDER: ThemeId[] = ['manuscript', 'wood', 'casino', 'neon', 'space', 'dragon']
