// Bodovanie hodu pri hre 10 000 (pre virtuálne kocky).
//  • jednotka = 100, päťka = 50
//  • tri rovnaké = číslo × 100, tri jednotky = 1 000
//  • každá ďalšia rovnaká kocka hodnotu zdvojnásobí (štyri dvojky = 400, päť dvojok = 800…)
//  • postupka 1–6 = 1 500

export const SCORING_RULES = [
  'Jednotka 100, päťka 50',
  'Tri rovnaké = číslo × 100, tri jednotky 1 000',
  'Každá ďalšia rovnaká kocka zdvojnásobí',
  'Postupka 1–6 = 1 500',
]

const counts = (faces: number[]) => {
  const c = [0, 0, 0, 0, 0, 0, 0]
  faces.forEach((f) => c[f]++)
  return c
}

/**
 * Body za vybrané kocky. Každá vybraná kocka musí bodovať – inak null
 * (napr. samotná dvojka sa odložiť nedá).
 */
export function scoreSelection(faces: number[]): number | null {
  if (!faces.length) return null
  const c = counts(faces)
  if (faces.length === 6 && c.slice(1).every((n) => n === 1)) return 1500
  let total = 0
  for (let f = 1; f <= 6; f++) {
    const n = c[f]
    if (n >= 3) total += (f === 1 ? 1000 : f * 100) * 2 ** (n - 3)
    else if (f === 1) total += 100 * n
    else if (f === 5) total += 50 * n
    else if (n > 0) return null
  }
  return total
}

/** Najlepší možný zisk z hodu (všetky bodujúce kocky) – 0 znamená prepadnutie. */
export function bestScore(faces: number[]): { points: number; dice: number[] } {
  const c = counts(faces)
  if (faces.length === 6 && c.slice(1).every((n) => n === 1)) return { points: 1500, dice: faces.map((_, i) => i) }
  const picked: number[] = []
  faces.forEach((f, i) => {
    if (f === 1 || f === 5 || c[f] >= 3) picked.push(i)
  })
  const points = scoreSelection(picked.map((i) => faces[i])) ?? 0
  return { points, dice: picked }
}

export const isBust = (faces: number[]) => bestScore(faces).points === 0

export const rollFaces = (n: number) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6))
