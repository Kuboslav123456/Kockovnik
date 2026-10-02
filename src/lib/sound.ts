import { getState } from './store'
import type { SoundId } from './types'

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

/** Krátky šum – cvaknutie žetónu */
function noise(start: number, dur: number, vol = 0.15, freq = 3000) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const src = a.createBufferSource()
  src.buffer = buf
  const filter = a.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  const gain = a.createGain()
  gain.gain.value = vol
  src.connect(filter).connect(gain).connect(a.destination)
  src.start(t0)
}

/** Cinknutie mince */
function coin(start: number, vol = 0.1) {
  tone(1980, start, 0.09, 'sine', vol)
  tone(2640, start + 0.06, 0.35, 'sine', vol)
}

export function haptic(pattern: number | number[]) {
  if (!getState().settings.vibration) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* nepodporované */
  }
}

type Pack = {
  tap(): void
  add(points: number): void
  zero(): void
  undo(): void
  error(): void
  win(): void
}

const PACKS: Record<SoundId, Pack> = {
  classic: {
    tap: () => tone(900, 0, 0.05, 'triangle', 0.06),
    add: (points) => {
      tone(880, 0, 0.18, 'sine', 0.16)
      tone(1320, 0.07, 0.22, 'sine', 0.13)
      if (points >= 1000) tone(1760, 0.14, 0.35, 'sine', 0.12)
    },
    zero: () => tone(330, 0, 0.35, 'sawtooth', 0.06, 160),
    undo: () => tone(600, 0, 0.12, 'triangle', 0.08, 400),
    error: () => {
      tone(220, 0, 0.12, 'square', 0.05)
      tone(200, 0.13, 0.15, 'square', 0.05)
    },
    win: () => {
      const notes = [523, 659, 784, 1047, 784, 1047, 1319]
      notes.forEach((f, i) => tone(f, i * 0.12, i === notes.length - 1 ? 0.8 : 0.2, 'triangle', 0.15))
    },
  },
  retro: {
    tap: () => tone(1200, 0, 0.03, 'square', 0.04),
    add: (points) => {
      const notes = points >= 1000 ? [523, 659, 784, 1047, 1319] : [659, 988]
      notes.forEach((f, i) => tone(f, i * 0.055, 0.07, 'square', 0.06))
    },
    zero: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.12, 0.12, 'square', 0.06)),
    undo: () => tone(800, 0, 0.1, 'square', 0.05, 300),
    error: () => tone(110, 0, 0.25, 'square', 0.07),
    win: () => {
      const notes = [523, 523, 523, 784, 698, 659, 587, 1047]
      notes.forEach((f, i) => tone(f, i * 0.1, i === notes.length - 1 ? 0.6 : 0.09, 'square', 0.07))
    },
  },
  casino: {
    tap: () => noise(0, 0.035, 0.12, 4000),
    add: (points) => {
      const coins = Math.min(7, Math.max(1, Math.ceil(points / 300)))
      for (let i = 0; i < coins; i++) coin(i * 0.07, 0.08)
      noise(0, 0.05, 0.1, 3500)
    },
    zero: () => {
      tone(300, 0, 0.5, 'triangle', 0.08, 120)
      noise(0.05, 0.08, 0.1, 2500)
    },
    undo: () => noise(0, 0.06, 0.12, 2500),
    error: () => tone(180, 0, 0.3, 'sawtooth', 0.05),
    win: () => {
      for (let i = 0; i < 14; i++) coin(i * 0.08, 0.07)
      ;[784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3 + i * 0.15, 0.5, 'triangle', 0.1))
    },
  },
}

export const sfx = {
  tap(pack: SoundId = 'classic') {
    PACKS[pack].tap()
    haptic(8)
  },
  add(points: number, pack: SoundId = 'classic') {
    PACKS[pack].add(points)
    haptic(points >= 1000 ? [20, 40, 30] : 15)
  },
  zero(pack: SoundId = 'classic') {
    PACKS[pack].zero()
    haptic([40, 60, 40])
  },
  undo(pack: SoundId = 'classic') {
    PACKS[pack].undo()
    haptic(10)
  },
  error(pack: SoundId = 'classic') {
    PACKS[pack].error()
    haptic([30, 40, 30])
  },
  win(pack: SoundId = 'classic') {
    PACKS[pack].win()
    haptic([60, 50, 60, 50, 200])
  },
  thunder() {
    noise(0, 0.6, 0.25, 400)
    haptic([60, 30, 120])
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
