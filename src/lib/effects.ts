import confetti from 'canvas-confetti'
import type { EffectId } from './types'

// Efekt víťaza sa spúšťa už pri pečati v hre – obrazovka výhry ho neopakuje
const played = new Set<string>()
export const markEffectPlayed = (gameId: string) => played.add(gameId)
export const wasEffectPlayed = (gameId: string) => played.has(gameId)

export function playEffect(effect: EffectId, colors: string[]) {
  const end = Date.now() + 2600

  if (effect === 'confetti') {
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors })
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  if (effect === 'fireworks') {
    const burst = () => {
      confetti({
        particleCount: 70,
        startVelocity: 32,
        spread: 360,
        ticks: 70,
        gravity: 0.9,
        scalar: 0.9,
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 },
        colors: [...colors, '#ffffff', '#ffe066'],
      })
    }
    burst()
    const id = setInterval(() => {
      if (Date.now() > end + 800) return clearInterval(id)
      burst()
    }, 380)
  }

  if (effect === 'goldrain') {
    const gold = ['#ffd700', '#ffec8b', '#e6b800', '#fff5cc']
    const frame = () => {
      confetti({
        particleCount: 6,
        startVelocity: 0,
        ticks: 260,
        gravity: 0.7,
        origin: { x: Math.random(), y: -0.05 },
        colors: gold,
        shapes: ['circle'],
        scalar: 1.2,
      })
      if (Date.now() < end + 1200) requestAnimationFrame(frame)
    }
    frame()
  }
}
