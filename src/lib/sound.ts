import { getState } from './store'
import type { SoundId } from './types'

// Zvuky sú syntetizované cez Web Audio – žiadne súbory, funguje offline.
let ctx: AudioContext | null = null
/** vygenerované struny loutny/harfy sa držia pre aktuálny kontext */
let plucks = new Map<string, AudioBuffer>()

function audio(): AudioContext | null {
  if (!getState().settings.sound) return null
  try {
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      plucks = new Map()
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
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

/** Krátky šum cez pásmový filter; voliteľne s posunom frekvencie (škrabnutie brka). */
function noise(start: number, dur: number, vol = 0.15, freq = 3000, toFreq?: number, q = 1) {
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
  filter.Q.value = q
  filter.frequency.setValueAtTime(freq, t0)
  if (toFreq) filter.frequency.exponentialRampToValueAtTime(toFreq, t0 + dur)
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

// ---------- Stredoveké nástroje ----------

/** Brnknutie struny (Karplus-Strong): šum v slučke s oneskorením a priemerovaním znie ako loutna či harfa. */
function pluck(freq: number, start: number, vol = 0.3, dur = 1.6, bright = 0.55) {
  const a = audio()
  if (!a) return
  const key = `${freq.toFixed(2)}|${dur}|${bright}`
  let buf = plucks.get(key)
  if (!buf) {
    const sr = a.sampleRate
    const len = Math.floor(sr * dur)
    buf = a.createBuffer(1, len, sr)
    const d = buf.getChannelData(0)
    const n = Math.max(2, Math.round(sr / freq))
    let lp = 0
    for (let i = 0; i < n; i++) {
      lp += bright * (Math.random() * 2 - 1 - lp)
      d[i] = lp
    }
    for (let i = n; i < len; i++) d[i] = 0.996 * 0.5 * (d[i - n] + (i - n - 1 >= 0 ? d[i - n - 1] : 0))
    let peak = 0
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]))
    const fade = Math.floor(sr * 0.05)
    for (let i = 0; i < len; i++) d[i] = (d[i] / (peak || 1)) * (i > len - fade ? (len - i) / fade : 1)
    plucks.set(key, buf)
  }
  const t0 = a.currentTime + start
  const src = a.createBufferSource()
  src.buffer = buf
  // teplé drevené telo nástroja
  const body = a.createBiquadFilter()
  body.type = 'peaking'
  body.frequency.value = 260
  body.Q.value = 1.2
  body.gain.value = 5
  const lp = a.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3800
  const g = a.createGain()
  g.gain.value = vol
  src.connect(body).connect(lp).connect(g).connect(a.destination)
  src.start(t0)
}

/** Zvon: neharmonické alikvoty skutočného zvona (hum, prima, tercia, kvinta…) s rôznym dozvukom. */
function bell(freq: number, start: number, vol = 0.12, dur = 2.6) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const partials: [number, number, number][] = [
    [0.5, 0.5, 1], [1, 1, 0.8], [1.19, 0.5, 0.55], [1.5, 0.35, 0.45], [2, 0.45, 0.4], [2.51, 0.22, 0.28], [2.66, 0.18, 0.25], [3.01, 0.2, 0.2], [4.1, 0.1, 0.15],
  ]
  partials.forEach(([ratio, amp, life]) => {
    const osc = a.createOscillator()
    const g = a.createGain()
    osc.frequency.value = freq * ratio
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(vol * amp, t0 + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * life)
    osc.connect(g).connect(a.destination)
    osc.start(t0)
    osc.stop(t0 + dur * life + 0.05)
  })
}

/** Heroldská trúbka: dva rozladené pílovité tóny, filter, ktorý sa pri nástupe otvorí, a vibrato. */
function brass(freq: number, start: number, dur: number, vol = 0.09) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + start
  const filter = a.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 2
  filter.frequency.setValueAtTime(350, t0)
  filter.frequency.exponentialRampToValueAtTime(2600, t0 + 0.06)
  filter.frequency.exponentialRampToValueAtTime(1500, t0 + Math.min(dur, 0.3))
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.04)
  g.gain.setValueAtTime(vol * 0.85, t0 + Math.max(0.05, dur - 0.08))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.12)
  filter.connect(g).connect(a.destination)
  const lfo = a.createOscillator()
  const lfoGain = a.createGain()
  lfo.frequency.value = 5.5
  lfoGain.gain.setValueAtTime(0, t0)
  lfoGain.gain.linearRampToValueAtTime(freq * 0.007, t0 + Math.min(dur, 0.25))
  lfo.connect(lfoGain)
  ;[-6, 6].forEach((cents) => {
    const osc = a.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = cents
    lfoGain.connect(osc.frequency)
    osc.connect(filter)
    osc.start(t0)
    osc.stop(t0 + dur + 0.2)
  })
  lfo.start(t0)
  lfo.stop(t0 + dur + 0.2)
}

/** Tlmený bubon (tabor) */
function drum(start: number, vol = 0.35) {
  tone(130, start, 0.32, 'sine', vol, 48)
  noise(start, 0.09, vol * 0.5, 220, undefined, 0.8)
}

/** Ťuk dreva o stôl */
function wood(start: number, vol = 0.12, pitch = 1) {
  noise(start, 0.025, vol, 2100 * pitch, undefined, 4)
  tone(780 * pitch, start, 0.035, 'triangle', vol * 0.5, 560 * pitch)
}

// Tóny: D dórska stupnica (stredoveký modus) a D dur pre fanfáru
const N = {
  A3: 220, D4: 293.66, F4: 349.23, A4: 440, D5: 587.33, E5: 659.25, Fs5: 739.99, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, Cs6: 1108.73, D6: 1174.66,
}

export function haptic(pattern: number | number[]) {
  if (!getState().settings.vibration) return
  // prehliadač vibráciu pred prvým dotykom aj tak zablokuje (a zapíše chybu do konzoly)
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
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
  medieval: {
    tap: () => wood(0, 0.13, 0.9 + Math.random() * 0.2),
    add: (points) => {
      const notes = [N.A4, N.D5, N.F5, N.A5, N.D6]
      const count = points >= 1000 ? 5 : points >= 500 ? 3 : 2
      notes.slice(0, count).forEach((f, i) => pluck(f, i * 0.07, 0.24 - i * 0.02))
      if (points >= 1000) bell(N.D5, 0.38, 0.1)
    },
    zero: () => {
      ;[N.F4, N.D4, N.A3].forEach((f, i) => pluck(f, i * 0.17, 0.2, 1.4, 0.4))
      drum(0.5, 0.18)
    },
    undo: () => noise(0, 0.13, 0.24, 2600, 6200, 3),
    error: () => {
      drum(0, 0.3)
      drum(0.15, 0.22)
    },
    win: () => {
      drum(0, 0.3)
      drum(0.15, 0.22)
      const fanfare: [number, number, number][] = [
        [N.A4, 0.3, 0.1], [N.D5, 0.42, 0.1], [N.Fs5, 0.54, 0.1], [N.A5, 0.66, 0.45], [N.Fs5, 1.16, 0.14], [N.A5, 1.32, 0.8],
      ]
      fanfare.forEach(([f, t, d]) => brass(f, t, d))
      fanfare.forEach(([f, t, d]) => brass(f / 2, t, d, 0.05))
      drum(1.32, 0.35)
      bell(N.D5, 1.4, 0.12, 3)
    },
  },
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
  tap(pack: SoundId = 'medieval') {
    PACKS[pack].tap()
    haptic(8)
  },
  add(points: number, pack: SoundId = 'medieval') {
    PACKS[pack].add(points)
    haptic(points >= 1000 ? [20, 40, 30] : 15)
  },
  zero(pack: SoundId = 'medieval') {
    PACKS[pack].zero()
    haptic([40, 60, 40])
  },
  undo(pack: SoundId = 'medieval') {
    PACKS[pack].undo()
    haptic(10)
  },
  error(pack: SoundId = 'medieval') {
    PACKS[pack].error()
    haptic([30, 40, 30])
  },
  win(pack: SoundId = 'medieval') {
    PACKS[pack].win()
    haptic([60, 50, 60, 50, 200])
  },
  thunder() {
    noise(0, 0.6, 0.25, 400)
    drum(0.05, 0.3)
    haptic([60, 30, 120])
  },
  /** nová úroveň – glissando na harfe */
  levelUp() {
    ;[N.D5, N.E5, N.Fs5, N.G5, N.A5, N.B5, N.Cs6, N.D6].forEach((f, i) => pluck(f, i * 0.045, 0.2, 1.8, 0.75))
    haptic([30, 30, 80])
  },
  /** otočenie karty – šuchot pergamenu */
  flip() {
    for (let i = 0; i < 4; i++) noise(i * 0.045 + Math.random() * 0.02, 0.06, 0.1, 3500 + Math.random() * 2500, undefined, 0.7)
    haptic(12)
  },
  /** hrkot kociek po stole */
  dice() {
    let t = 0
    for (let i = 0; i < 7; i++) {
      wood(t, 0.16 * (1 - i / 9), 0.8 + Math.random() * 0.6)
      t += 0.04 + Math.random() * 0.07
    }
    haptic([10, 30, 10, 30, 10])
  },
  /** buchnutie voskovej pečate */
  seal() {
    drum(0, 0.32)
    wood(0.01, 0.08, 0.6)
    haptic(40)
  },
}
