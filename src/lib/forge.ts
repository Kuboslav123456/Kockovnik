// Kováreň – hráč si za mince vykuje vlastnú kocku: materiál, farba, oká, erb a efekt.
// Kvalitu (učňovská / tovarišská / majstrovská) určí minihra s kladivom.

import { DIE_MAP, type DieDef } from './dice'
import { levelFromXp } from './progression'
import type { CustomDie, EmblemKind, ForgeEffect, ForgeQuality, ForgeSpec, PipStyle, Profile } from './types'

/** koľko vlastných kociek môže mať jeden hráč naraz */
export const FORGE_SLOTS = 3

interface Tint {
  id: string
  name: string
  face: string
  edge: string
  /** farba žiary, keď si hráč vyberie efekt Žiara */
  glow: string
}

export interface Material {
  id: string
  name: string
  icon: string
  /** od ktorej úrovne sa dá použiť */
  level: number
  cost: number
  /** kov, sklo a drahokamy sa lesknú samy */
  shine?: boolean
  tints: Tint[]
}

const radial = (light: string, mid: string, dark: string) => `radial-gradient(circle at 30% 25%, ${light} 0%, ${mid} 55%, ${dark} 100%)`
const metal = (a: string, b: string, c: string, d: string) => `linear-gradient(135deg, ${a} 0%, ${b} 38%, ${c} 68%, ${d} 100%)`
const glass = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`

export const MATERIALS: Material[] = [
  {
    id: 'wood', name: 'Drevo', icon: '🪵', level: 1, cost: 30,
    tints: [
      { id: 'birch', name: 'Breza', face: radial('#fbf3df', '#eadcb8', '#c9b68c'), edge: '#a8946c', glow: 'rgba(255,230,170,0.5)' },
      { id: 'oak', name: 'Dub', face: radial('#c58f5a', '#9a6534', '#6b4220'), edge: '#5a3518', glow: 'rgba(230,160,80,0.5)' },
      { id: 'walnut', name: 'Orech', face: radial('#8a5a34', '#5e3a1e', '#3a2210'), edge: '#2a180a', glow: 'rgba(200,120,60,0.5)' },
      { id: 'ebony', name: 'Eben', face: radial('#4a3a30', '#2a1e18', '#120c08'), edge: '#0a0604', glow: 'rgba(255,190,120,0.45)' },
    ],
  },
  {
    id: 'bone', name: 'Kosť', icon: '🦴', level: 1, cost: 30,
    tints: [
      { id: 'ivory', name: 'Slonovina', face: radial('#fffaf0', '#efe4cc', '#cdbb98'), edge: '#b9a47c', glow: 'rgba(255,240,200,0.55)' },
      { id: 'parchment', name: 'Pergamen', face: radial('#f7e7bf', '#e3c98e', '#b8995c'), edge: '#9a7c44', glow: 'rgba(240,200,120,0.5)' },
      { id: 'ash', name: 'Popolavá', face: radial('#ebe8e2', '#cfcac2', '#9e978c'), edge: '#7e776c', glow: 'rgba(220,220,230,0.5)' },
    ],
  },
  {
    id: 'stone', name: 'Kameň', icon: '🪨', level: 1, cost: 40,
    tints: [
      { id: 'granite', name: 'Žula', face: radial('#b9b5ad', '#8f8a80', '#5f5b54'), edge: '#4f4b45', glow: 'rgba(200,200,210,0.45)' },
      { id: 'sandstone', name: 'Pieskovec', face: radial('#f0d3a4', '#c9a46a', '#8e6e3e'), edge: '#6e5530', glow: 'rgba(240,190,120,0.5)' },
      { id: 'slate', name: 'Bridlica', face: radial('#7d8691', '#545c66', '#30363d'), edge: '#22272c', glow: 'rgba(150,180,220,0.45)' },
      {
        id: 'marble', name: 'Mramor',
        face: 'linear-gradient(125deg, #ffffff 0%, #ece9e4 28%, #c9c3ba 30%, #f5f3ef 42%, #ddd8d0 66%, #b9b2a8 68%, #fbfaf8 80%, #e6e2dc 100%)',
        edge: '#a9a29a', glow: 'rgba(255,255,255,0.55)',
      },
    ],
  },
  {
    id: 'metal', name: 'Kov', icon: '⚙️', level: 4, cost: 120, shine: true,
    tints: [
      { id: 'copper', name: 'Meď', face: metal('#f7c39c', '#c8743f', '#8a4a24', '#e8a070'), edge: '#6a3a1c', glow: 'rgba(240,140,80,0.5)' },
      { id: 'bronze', name: 'Bronz', face: metal('#f0d08a', '#b0842e', '#6e4e14', '#d8b060'), edge: '#5e420e', glow: 'rgba(230,180,80,0.5)' },
      { id: 'silver', name: 'Striebro', face: metal('#ffffff', '#c9ced6', '#8b929c', '#e6e9ee'), edge: '#6b7380', glow: 'rgba(200,215,235,0.6)' },
      { id: 'gold', name: 'Zlato', face: metal('#fff6c4', '#f5c842', '#c48a0c', '#ffe27a'), edge: '#8a5a00', glow: 'rgba(255,200,60,0.6)' },
    ],
  },
  {
    id: 'glass', name: 'Sklo', icon: '🔮', level: 7, cost: 160, shine: true,
    tints: [
      { id: 'blue', name: 'Modré', face: glass('rgba(190,230,255,0.95)', 'rgba(70,140,220,0.88)'), edge: '#2f6aa0', glow: 'rgba(110,180,255,0.6)' },
      { id: 'green', name: 'Zelené', face: glass('rgba(200,255,220,0.95)', 'rgba(60,170,110,0.88)'), edge: '#2a7a4a', glow: 'rgba(100,230,150,0.55)' },
      { id: 'rose', name: 'Ružové', face: glass('rgba(255,215,235,0.95)', 'rgba(220,90,150,0.88)'), edge: '#a03a6e', glow: 'rgba(255,130,190,0.55)' },
      { id: 'amber', name: 'Jantár', face: glass('rgba(255,225,150,0.95)', 'rgba(220,140,30,0.9)'), edge: '#8a4a04', glow: 'rgba(255,180,60,0.6)' },
    ],
  },
  {
    id: 'gem', name: 'Drahokam', icon: '💎', level: 10, cost: 300, shine: true,
    tints: [
      { id: 'ruby', name: 'Rubín', face: radial('#ff7a8a', '#d01030', '#6e0418'), edge: '#5a0414', glow: 'rgba(230,30,60,0.6)' },
      { id: 'emerald', name: 'Smaragd', face: radial('#7dffb4', '#12a35a', '#04502a'), edge: '#044222', glow: 'rgba(30,200,110,0.55)' },
      { id: 'sapphire', name: 'Zafír', face: radial('#8ab8ff', '#1c4fd0', '#0a2270'), edge: '#081a56', glow: 'rgba(60,120,255,0.6)' },
      { id: 'amethyst', name: 'Ametyst', face: radial('#e2a8ff', '#8a2fd0', '#3e0c6e'), edge: '#300a56', glow: 'rgba(170,80,255,0.6)' },
    ],
  },
  {
    id: 'obsidian', name: 'Obsidián', icon: '🌑', level: 14, cost: 450,
    tints: [
      { id: 'black', name: 'Čierny', face: radial('#4a4458', '#1a1622', '#050308'), edge: '#000000', glow: 'rgba(160,140,255,0.5)' },
      { id: 'blood', name: 'Krvavý', face: radial('#6a1a22', '#2e070c', '#0a0103'), edge: '#000000', glow: 'rgba(255,40,60,0.55)' },
      { id: 'venom', name: 'Jedový', face: radial('#1e5a3a', '#0c2a1a', '#020a05'), edge: '#000000', glow: 'rgba(60,255,140,0.5)' },
      { id: 'starry', name: 'Hviezdny', face: radial('#3a3a8a', '#141448', '#04041a'), edge: '#000000', glow: 'rgba(140,160,255,0.6)' },
    ],
  },
]

export const MATERIAL_MAP: Record<string, Material> = Object.fromEntries(MATERIALS.map((m) => [m.id, m]))

export const PIP_COLORS: { id: string; name: string; color: string }[] = [
  { id: 'ink', name: 'Čierna', color: '#1a120a' },
  { id: 'white', name: 'Biela', color: '#fffaf0' },
  { id: 'gold', name: 'Zlatá', color: '#f5c842' },
  { id: 'red', name: 'Červená', color: '#c2261b' },
  { id: 'blue', name: 'Modrá', color: '#1f4fa8' },
  { id: 'green', name: 'Zelená', color: '#1d7a44' },
  { id: 'purple', name: 'Fialová', color: '#6b2fa0' },
  { id: 'silver', name: 'Strieborná', color: '#c9ced6' },
]

export const PIP_STYLES: Record<PipStyle, { name: string; icon: string; level: number; cost: number }> = {
  dots: { name: 'Bodky', icon: '⚃', level: 1, cost: 0 },
  diamonds: { name: 'Kosoštvorce', icon: '◆', level: 2, cost: 30 },
  roman: { name: 'Rímske', icon: 'IV', level: 3, cost: 40 },
  stars: { name: 'Hviezdy', icon: '★', level: 5, cost: 50 },
}

export const EMBLEMS: Record<EmblemKind, { name: string; level: number; cost: number }> = {
  none: { name: 'Bez erbu', level: 1, cost: 0 },
  initial: { name: 'Iniciála', level: 1, cost: 40 },
  avatar: { name: 'Avatar', level: 3, cost: 60 },
}

export const FORGE_EFFECTS: Record<ForgeEffect, { name: string; icon: string; level: number; cost: number }> = {
  none: { name: 'Žiadny', icon: '·', level: 1, cost: 0 },
  shine: { name: 'Lesk', icon: '✨', level: 2, cost: 40 },
  pipglow: { name: 'Svietiace oká', icon: '💡', level: 5, cost: 80 },
  glow: { name: 'Žiara', icon: '🔆', level: 8, cost: 150 },
  sparkle: { name: 'Iskrenie', icon: '🎇', level: 12, cost: 250 },
}

export const QUALITY: Record<ForgeQuality, { name: string; stars: number; desc: string }> = {
  apprentice: { name: 'Učňovská', stars: 1, desc: 'Poctivá práca začínajúceho učňa.' },
  journeyman: { name: 'Tovarišská', stars: 2, desc: 'Pevná ruka skúseného tovariša.' },
  master: { name: 'Majstrovská', stars: 3, desc: 'Dielo majstra – zlaté hrany a jemná žiara.' },
}

export const DEFAULT_SPEC: ForgeSpec = { material: 'wood', tint: 'oak', pipColor: 'ink', pipStyle: 'dots', emblem: 'none', effect: 'none' }

const NAMES = [
  'Šťastena', 'Zúrivka', 'Kráľovná stola', 'Prekliata', 'Bleskovka', 'Tichá smrť', 'Dračie oko', 'Vlčí zub', 'Posledná nádej',
  'Zlatá ruka', 'Krčmárova pýcha', 'Hromovládkyňa', 'Osudová', 'Čarodejnica', 'Strážkyňa šestiek', 'Nočná mora', 'Pálivá', 'Svätá jednotka',
]
export const randomDieName = (not?: string) => {
  const pool = NAMES.filter((n) => n !== not)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function forgeCost(spec: ForgeSpec): number {
  return (MATERIAL_MAP[spec.material]?.cost ?? 0) + PIP_STYLES[spec.pipStyle].cost + EMBLEMS[spec.emblem].cost + FORGE_EFFECTS[spec.effect].cost
}

/** Je voľba dostupná pri úrovni hráča? */
export const unlocked = (profile: Pick<Profile, 'xp'>, level: number) => levelFromXp(profile.xp) >= level

/** Z návrhu (alebo hotovej kocky) poskladá kocku, ktorú vie vykresliť Die3D. */
export function buildDie(spec: ForgeSpec & Partial<Pick<CustomDie, 'id' | 'name' | 'quality' | 'emblemText'>>): DieDef {
  const m = MATERIAL_MAP[spec.material] ?? MATERIALS[0]
  const t = m.tints.find((x) => x.id === spec.tint) ?? m.tints[0]
  const master = spec.quality === 'master'
  return {
    id: spec.id ?? 'preview',
    name: spec.name ?? 'Nová kocka',
    rarity: 'legendary',
    desc: spec.quality ? `${QUALITY[spec.quality].name} práca z kovárne. ${m.name}, ${t.name.toLowerCase()}.` : '',
    face: t.face,
    pip: PIP_COLORS.find((c) => c.id === spec.pipColor)?.color ?? '#1a120a',
    edge: master ? '#d4a017' : t.edge,
    glow: spec.effect === 'glow' ? t.glow : master ? 'rgba(255,200,80,0.38)' : undefined,
    pipGlow: spec.effect === 'pipglow',
    shine: m.shine || spec.effect === 'shine',
    pipStyle: spec.pipStyle,
    emblem: spec.emblem === 'none' ? undefined : spec.emblemText,
    sparkle: spec.effect === 'sparkle',
  }
}

/** Text erbu pre hráča: prvé písmeno mena alebo jeho avatar */
export function emblemFor(kind: EmblemKind, profile: Pick<Profile, 'name' | 'avatar'>): string | undefined {
  if (kind === 'initial') return Array.from(profile.name.trim() || '?')[0].toLocaleUpperCase('sk-SK')
  if (kind === 'avatar') return profile.avatar
  return undefined
}

/** Obľúbená kocka hráča – z Klenotnice alebo z kovárne */
export function profileDie(profile: Pick<Profile, 'favoriteDie' | 'custom'>): DieDef | null {
  const id = profile.favoriteDie
  if (!id) return null
  if (id.startsWith('c_')) {
    const c = profile.custom?.find((x) => x.id === id)
    return c ? buildDie(c) : null
  }
  return DIE_MAP[id] ?? null
}
