// Klenotnica – vzácne kocky, ktoré hráči získavajú z truhlíc po každej hre.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type ChestTier = 'wood' | 'iron' | 'gold'

export interface DieDef {
  id: string
  name: string
  rarity: Rarity
  desc: string
  /** pozadie stien kocky */
  face: string
  /** farba bodiek */
  pip: string
  /** farba hrán */
  edge: string
  /** žiara okolo kocky (vzácne kusy) */
  glow?: string
  /** bodky svietia */
  pipGlow?: boolean
  /** po stenách prechádza lesk */
  shine?: boolean
}

export const RARITIES: Record<Rarity, { name: string; color: string; coins: number; forge: number }> = {
  common: { name: 'Bežná', color: '#8a7a62', coins: 5, forge: 30 },
  rare: { name: 'Vzácna', color: '#2f7fb8', coins: 15, forge: 90 },
  epic: { name: 'Epická', color: '#8b3fb5', coins: 40, forge: 240 },
  legendary: { name: 'Legendárna', color: '#c98a12', coins: 100, forge: 600 },
  mythic: { name: 'Mýtická', color: '#c2261b', coins: 250, forge: 1500 },
}

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic']

export const CHESTS: Record<ChestTier, { name: string; icon: string; coins: number; weights: Record<Rarity, number> }> = {
  wood: { name: 'Drevená truhlica', icon: '🪵', coins: 2, weights: { common: 60, rare: 25, epic: 11, legendary: 3.5, mythic: 0.5 } },
  iron: { name: 'Železná truhlica', icon: '⚙️', coins: 5, weights: { common: 45, rare: 32, epic: 17, legendary: 5, mythic: 1 } },
  gold: { name: 'Zlatá truhlica', icon: '👑', coins: 10, weights: { common: 25, rare: 35, epic: 27, legendary: 10, mythic: 3 } },
}

const radial = (light: string, mid: string, dark: string) => `radial-gradient(circle at 30% 25%, ${light} 0%, ${mid} 55%, ${dark} 100%)`

export const DICE: DieDef[] = [
  // ---- bežné ----
  { id: 'oak', name: 'Dubová', rarity: 'common', desc: 'Vyrezaná z dubu, čo rástol pri hradnej priekope.', face: radial('#c58f5a', '#9a6534', '#6b4220'), pip: '#2a1708', edge: '#5a3518' },
  { id: 'bone', name: 'Kostená', rarity: 'common', desc: 'Klasika pútnikov a vojakov v krčmách.', face: radial('#fffaf0', '#efe4cc', '#cdbb98'), pip: '#3a2a1a', edge: '#b9a47c' },
  { id: 'clay', name: 'Hlinená', rarity: 'common', desc: 'Vypálená v hrnčiarskej peci za dedinou.', face: radial('#e4936a', '#c46a40', '#8e4422'), pip: '#3b1a0a', edge: '#7a3a1c' },
  { id: 'birch', name: 'Brezová', rarity: 'common', desc: 'Svetlá a ľahká, skáče po stole ako zajac.', face: radial('#fbf3df', '#eadcb8', '#c9b68c'), pip: '#4a3a24', edge: '#a8946c' },
  { id: 'stone', name: 'Kamenná', rarity: 'common', desc: 'Ťažká ako svedomie. Hodíš ňou raz za večer.', face: radial('#b9b5ad', '#8f8a80', '#5f5b54'), pip: '#1e1c19', edge: '#4f4b45' },
  { id: 'horn', name: 'Rohová', rarity: 'common', desc: 'Z jelenieho parožia, hladká od tisícok hodov.', face: radial('#d9c39c', '#a88b5e', '#6e5634'), pip: '#2a1d0e', edge: '#5e4a2c' },
  { id: 'slate', name: 'Bridlicová', rarity: 'common', desc: 'Tmavá ako noc nad horami.', face: radial('#6b7280', '#4b5260', '#2c313b'), pip: '#e8e2d4', edge: '#262a33' },
  { id: 'sandstone', name: 'Pieskovcová', rarity: 'common', desc: 'Drobí sa jej roh, ale šťastie drží.', face: radial('#ead1a0', '#d0b072', '#a2844c'), pip: '#4a3418', edge: '#8c7040' },
  // ---- vzácne ----
  { id: 'amber', name: 'Jantárová', rarity: 'rare', desc: 'V jej vnútri je uväznený komár z dávnych čias.', face: radial('#ffd88a', '#e89a1e', '#a85c06'), pip: '#4a2400', edge: '#8a4a04', shine: true },
  { id: 'copper', name: 'Medená', rarity: 'rare', desc: 'Zelenkastá patina prezrádza jej vek.', face: radial('#f2b48a', '#c8743f', '#7d4222'), pip: '#1f4e3d', edge: '#6a3a1c', shine: true },
  { id: 'glass', name: 'Sklená', rarity: 'rare', desc: 'Fúkaná benátskym sklárom. Opatrne s ňou!', face: 'linear-gradient(135deg, rgba(190,230,255,0.95), rgba(90,160,220,0.85))', pip: '#0c2c4a', edge: '#3a7ab0', shine: true },
  { id: 'bronze', name: 'Bronzová', rarity: 'rare', desc: 'Odliata z rovnakého kovu ako zvon na veži.', face: radial('#e0b86a', '#b0842e', '#6e4e14'), pip: '#2a1a04', edge: '#5e420e', shine: true },
  { id: 'cobalt', name: 'Kobaltová', rarity: 'rare', desc: 'Glazúra modrá ako šaty Panny Márie na oltári.', face: radial('#6aa0ff', '#2350c8', '#122a74'), pip: '#f2f2ff', edge: '#0e2160' },
  { id: 'pearl', name: 'Perleťová', rarity: 'rare', desc: 'Mení farbu podľa svetla sviec.', face: 'linear-gradient(135deg, #fdf6ff, #e7f0ff 35%, #fbe8f2 65%, #eafff6)', pip: '#5a4a6a', edge: '#b9aac8', shine: true },
  { id: 'jade', name: 'Nefritová', rarity: 'rare', desc: 'Priniesol ju kupec z ďalekého Východu.', face: radial('#9be0b0', '#3f9f68', '#1c5a38'), pip: '#0a2416', edge: '#174a2e', shine: true },
  // ---- epické ----
  { id: 'silver', name: 'Strieborná', rarity: 'epic', desc: 'Vraj ochráni pred upírmi aj pred smolou.', face: 'linear-gradient(135deg, #ffffff, #c9ced6 40%, #8b929c 70%, #e6e9ee)', pip: '#1c2230', edge: '#6b7380', shine: true, glow: 'rgba(200,215,235,0.6)' },
  { id: 'ruby', name: 'Rubínová', rarity: 'epic', desc: 'Vypadla z koruny zabudnutého kráľa.', face: radial('#ff7a8a', '#d01030', '#6e0418'), pip: '#ffe0b0', edge: '#5a0414', shine: true, glow: 'rgba(230,30,60,0.55)' },
  { id: 'emerald', name: 'Smaragdová', rarity: 'epic', desc: 'Zelená ako lesy, kam sa neodváži nik.', face: radial('#7dffb4', '#12a35a', '#04502a'), pip: '#fff4c0', edge: '#044222', shine: true, glow: 'rgba(30,200,110,0.5)' },
  { id: 'sapphire', name: 'Zafírová', rarity: 'epic', desc: 'Hlboká modrá, v ktorej sa topia hviezdy.', face: radial('#8ab8ff', '#1846c8', '#081c66'), pip: '#fff6d0', edge: '#061650', shine: true, glow: 'rgba(40,90,240,0.55)' },
  { id: 'obsidian', name: 'Obsidiánová', rarity: 'epic', desc: 'Sopečné sklo. Bodky žiaria ako žeravé uhlíky.', face: radial('#4a4458', '#1c1824', '#05040a'), pip: '#ff7a2a', edge: '#000000', pipGlow: true, glow: 'rgba(255,110,40,0.45)' },
  // ---- legendárne ----
  { id: 'crest', name: 'Zlatá s erbom', rarity: 'legendary', desc: 'Nesie erb rodu, ktorý nikdy neprehral partiu.', face: 'linear-gradient(135deg, #fff3b0, #f5c842 35%, #c48a0c 70%, #ffe27a)', pip: '#7a1a10', edge: '#8a5a00', shine: true, glow: 'rgba(255,200,40,0.7)' },
  { id: 'dragonbone', name: 'Dračia kosť', rarity: 'legendary', desc: 'Z kosti draka, ktorého skolil svätý Juraj.', face: radial('#fff4dc', '#e2c79a', '#9c7a46'), pip: '#b3200e', edge: '#6e4a1a', pipGlow: true, glow: 'rgba(255,120,40,0.6)' },
  { id: 'starry', name: 'Hviezdna', rarity: 'legendary', desc: 'Spadla z neba v noc, keď letela kométa.', face: 'radial-gradient(circle at 30% 25%, #3a3aa8 0%, #12124a 60%, #05051c 100%)', pip: '#fff6b0', edge: '#05051c', pipGlow: true, shine: true, glow: 'rgba(140,140,255,0.7)' },
  // ---- mýtická ----
  { id: 'fate', name: 'Kocka osudu', rarity: 'mythic', desc: 'Hovorí sa, že ňou hádzali sudičky pri kolíske kráľov.', face: 'radial-gradient(circle at 30% 25%, #3a2a10 0%, #120a02 65%, #000 100%)', pip: '#ffd23f', edge: '#c98a12', pipGlow: true, shine: true, glow: 'rgba(255,190,40,0.85)' },
]

export const DIE_MAP: Record<string, DieDef> = Object.fromEntries(DICE.map((d) => [d.id, d]))

/** Ktorú truhlicu hráč dostane podľa výkonu v hre */
export function chestTier(won: boolean, feat: boolean): ChestTier {
  if (feat) return 'gold'
  return won ? 'iron' : 'wood'
}

/** Vytiahne kocku z truhlice: najprv vzácnosť podľa váh, potom náhodná kocka danej vzácnosti */
export function rollDie(tier: ChestTier, rand: () => number = Math.random): DieDef {
  const w = CHESTS[tier].weights
  const total = RARITY_ORDER.reduce((a, r) => a + w[r], 0)
  let x = rand() * total
  let rarity: Rarity = 'common'
  for (const r of RARITY_ORDER) {
    if (x < w[r]) {
      rarity = r
      break
    }
    x -= w[r]
  }
  const pool = DICE.filter((d) => d.rarity === rarity)
  return pool[Math.floor(rand() * pool.length) % pool.length]
}
