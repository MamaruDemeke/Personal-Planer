/**
 * Phone-style ring + vibration.
 *
 * Mobile browsers only allow audio after a user gesture, so `unlockAudio` is
 * called on the first tap/click/key press and keeps a single AudioContext
 * alive. `ring` then plays a two-tone telephone ring and vibrates.
 */

const SOUND_KEY = 'mezgab-sound-enabled'

let ctx = null
let soundEnabled = readSoundPreference()

function readSoundPreference() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function isSoundEnabled() {
  return soundEnabled
}

export function setSoundEnabled(on) {
  soundEnabled = !!on
  try {
    localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off')
  } catch {
    /* Storage may be unavailable - the setting still works in-memory. */
  }
  return soundEnabled
}

function getContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!ctx) {
    try {
      ctx = new AudioCtx()
    } catch {
      return null
    }
  }
  return ctx
}

/** Must run inside a user gesture (tap, click, key press). */
export function unlockAudio() {
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  try {
    const gain = c.createGain()
    gain.gain.value = 0.0001
    const osc = c.createOscillator()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + 0.01)
  } catch {
    /* Ignore - unlocking is best effort. */
  }
}

export function vibrate(pattern = [600, 300, 600, 300, 600]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* Not supported (iOS Safari) - ignore. */
  }
}

const RING_ON = 0.9
const RING_OFF = 1.1
const RINGS = 3
const MIN_GAP = 5000

let lastRing = 0

/** Play a classic phone ring (440 Hz + 480 Hz) and vibrate. */
export function ring({ force = false } = {}) {
  const now = Date.now()
  if (!force && now - lastRing < MIN_GAP) return
  lastRing = now

  vibrate()
  if (!soundEnabled) return
  const c = getContext()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})

  const start = c.currentTime + 0.02
  for (let i = 0; i < RINGS; i += 1) {
    const base = start + i * (RING_ON + RING_OFF)
    for (const frequency of [440, 480]) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, base)
      gain.gain.exponentialRampToValueAtTime(0.16, base + 0.05)
      gain.gain.setValueAtTime(0.16, base + RING_ON - 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, base + RING_ON)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start(base)
      osc.stop(base + RING_ON)
    }
  }
}
