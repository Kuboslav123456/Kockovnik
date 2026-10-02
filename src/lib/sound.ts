import { getState } from './store'

// Zvuky sú syntetizované cez Web Audio – žiadne súbory, funguje offline.
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (!getState().settings.sound) return null
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, slideTo?: number) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export function haptic(pattern: number | number[]) {
  if (!getState().settings.vibration) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* nepodporované */
  }
}

export const sfx = {
  tap() {
    tone(900, 0, 0.05, 'triangle', 0.06)
    haptic(8)
  },
  add(points: number) {
    const big = points >= 1000
    tone(880, 0, 0.18, 'sine', 0.16)
    tone(1320, 0.07, 0.22, 'sine', 0.13)
    if (big) tone(1760, 0.14, 0.35, 'sine', 0.12)
    haptic(big ? [20, 40, 30] : 15)
  },
  zero() {
    tone(330, 0, 0.35, 'sawtooth', 0.06, 160)
    haptic([40, 60, 40])
  },
  undo() {
    tone(600, 0, 0.12, 'triangle', 0.08, 400)
    haptic(10)
  },
  error() {
    tone(220, 0, 0.12, 'square', 0.05)
    tone(200, 0.13, 0.15, 'square', 0.05)
    haptic([30, 40, 30])
  },
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319]
    notes.forEach((f, i) => tone(f, i * 0.12, i === notes.length - 1 ? 0.8 : 0.2, 'triangle', 0.15))
    haptic([60, 50, 60, 50, 200])
  },
  tick() {
    tone(1500, 0, 0.03, 'sine', 0.04)
  },
  levelUp() {
    ;[784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.4, 'sine', 0.14))
    haptic([30, 30, 80])
  },
  flip() {
    tone(500, 0, 0.15, 'triangle', 0.08, 1200)
    haptic(12)
  },
}
