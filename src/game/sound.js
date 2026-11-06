// Pool sounds with the Web Audio API, driven by the events the engine records
// in game.events. Recorded clips (public/sounds, cut from the owner's
// billiard2/billiard3 recordings) for the cue strike, ball-on-ball clicks and
// pocketed balls; the cushion bump is synthesised, and so is anything whose
// clip hasn't loaded yet.
import { MAX_SPEED } from './pool'

const CLIPS = { cue: '/sounds/cue-strike.mp3', hit: '/sounds/ball-hit.mp3', pocket: '/sounds/pocket.mp3' }
// fetched right away (small files); decoded once there is an audio context
const raw = Object.fromEntries(Object.entries(CLIPS).map(([k, url]) => [k, fetch(url).then((r) => r.arrayBuffer()).catch(() => null)]))
const buffers = {}

let ctx = null
let master = null
let noise = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.7
    master.connect(ctx.destination)
    // one second of white noise, reused by every burst
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    for (const [k, p] of Object.entries(raw))
      p.then((ab) => ab && ctx.decodeAudioData(ab)).then((b) => b && (buffers[k] = b)).catch(() => {})
  }
  if (ctx.state === 'suspended') ctx.resume() // pool is played with clicks, so this is allowed
  return ctx
}

// A filtered noise burst with an exponential decay.
function burst(t, { freq, q = 1, type = 'bandpass', decay, gain }) {
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.playbackRate.value = 0.9 + Math.random() * 0.2
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  src.connect(f).connect(g).connect(master)
  src.start(t, Math.random() * 0.5)
  src.stop(t + decay + 0.02)
}

// A short decaying tone (the "ping" of a hard ball, the thump of a pocket).
function tone(t, { freq, to = freq, decay, gain, type = 'sine' }) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to !== freq) o.frequency.exponentialRampToValueAtTime(to, t + decay)
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + decay + 0.02)
}

// Start the audio (and decode the clips) at the visitor's first interaction,
// so the very first cue strike already has its recording. On a phone only the
// end of a touch unlocks audio, so listen for releases too, and keep at it
// until the context is actually running.
const UNLOCK = ['pointerup', 'touchend', 'click', 'keydown']
const prime = () => {
  const a = audio()
  if (a?.state === 'running') for (const type of UNLOCK) removeEventListener(type, prime, { capture: true })
}
for (const type of UNLOCK) addEventListener(type, prime, { capture: true })

const level = (speed) => Math.min(1, speed / MAX_SPEED)

// One of the recorded clips, a touch of pitch variation so repeats don't sound
// copied. Returns false when the clip isn't ready (the caller falls back).
function clip(name, t, gain, rate = 1) {
  const b = buffers[name]
  if (!b) return false
  const src = ctx.createBufferSource()
  src.buffer = b
  src.playbackRate.value = rate * (0.95 + Math.random() * 0.1)
  const g = ctx.createGain()
  g.gain.value = gain
  src.connect(g).connect(master)
  src.start(t)
  return true
}

// two resin balls meeting: bright, very short clack
function click(t, v) {
  if (clip('hit', t, 0.9 * v)) return
  const f = 2600 + Math.random() * 1400
  burst(t, { freq: f, q: 5, decay: 0.045, gain: 0.9 * v })
  tone(t, { freq: f * 0.9, decay: 0.035, gain: 0.25 * v, type: 'triangle' })
}

// the leather tip on the cue ball: a softer, lower "tock"
function cueStrike(t, v) {
  if (clip('cue', t, 1.8 * v)) return
  burst(t, { freq: 1500, q: 2, decay: 0.035, gain: 0.7 * v })
  tone(t, { freq: 260, to: 180, decay: 0.06, gain: 0.35 * v })
}

// a ball against a cushion: dull, padded bump
function cushion(t, v) {
  burst(t, { freq: 420, type: 'lowpass', q: 0.7, decay: 0.09, gain: 0.55 * v })
  tone(t, { freq: 130, to: 95, decay: 0.08, gain: 0.3 * v })
}

// the break: one hard crack as the cue ball meets the rack, then the balls
// clattering into each other as it spreads
function breakCrack(t, v) {
  if (clip('hit', t, 1.2 * v, 0.92)) {
    clip('hit', t + 0.006, 0.6 * v, 1.08) // a second contact on top: the rack hit as one crack
  } else {
    burst(t, { freq: 3000, q: 3, decay: 0.07, gain: 1.0 * v })
    burst(t, { freq: 1800, q: 2, decay: 0.09, gain: 0.7 * v })
    tone(t, { freq: 2400, decay: 0.05, gain: 0.3 * v, type: 'triangle' })
  }
  for (let i = 0; i < 9; i++) click(t + 0.012 + Math.random() * 0.16, v * (0.35 + Math.random() * 0.4))
}

// a ball dropping into a pocket: a hollow thunk, then a small rattle as it settles
function pocketDrop(t, v) {
  const k = 0.5 + 0.5 * v
  if (clip('pocket', t, 1.1 * k)) return
  tone(t, { freq: 210, to: 120, decay: 0.16, gain: 0.55 * k })
  burst(t, { freq: 650, q: 1.5, decay: 0.08, gain: 0.45 * k })
  burst(t + 0.09, { freq: 900, q: 3, decay: 0.04, gain: 0.22 * k })
  burst(t + 0.16, { freq: 800, q: 3, decay: 0.035, gain: 0.12 * k })
  tone(t + 0.05, { freq: 95, to: 70, decay: 0.2, gain: 0.25 * k })
}

// Play what the engine recorded since the last frame. The break and busy
// frames are capped so a cluster of contacts doesn't turn into noise.
let recent = []
export function playPoolEvents(events) {
  if (!events.length) return
  const a = audio()
  if (!a) return
  const now = a.currentTime
  recent = recent.filter((r) => now - r < 0.1)
  let i = 0
  for (const e of events) {
    const v = level(e.speed)
    const t = now + 0.004 * i++
    if (e.type === 'cue') cueStrike(t, Math.max(0.25, v))
    else if (e.type === 'pocket') pocketDrop(t, v)
    else if (e.type === 'ball') {
      if (e.breakShot && e.first) breakCrack(t, Math.max(0.6, v))
      else if (v > 0.015 && recent.length < 10) {
        recent.push(now)
        click(t, Math.min(1, 0.15 + v * 1.4))
      }
    } else if (e.type === 'rail' && v > 0.04 && recent.length < 10) {
      recent.push(now)
      cushion(t, Math.min(1, 0.2 + v * 1.2))
    }
  }
}
