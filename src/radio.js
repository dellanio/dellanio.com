import { useSyncExternalStore } from 'react'

// The boteco radio: the live "Fay Só Forró" stream. One <audio> element for
// the whole site; the HUD control and the radio on the shelf share this state.
const STREAM = 'https://stm5.xcast.com.br:10684/wfai'

// status: 'off' | 'loading' | 'playing' | 'blocked' (waiting for a click) | 'error'
let state = { status: 'off', volume: 0.25, userOff: false }
const listeners = new Set()
const set = (patch) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

let audio
function element() {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'none'
  audio.volume = state.volume
  audio.addEventListener('playing', () => set({ status: 'playing' }))
  audio.addEventListener('waiting', () => state.status === 'playing' && set({ status: 'loading' }))
  audio.addEventListener('error', () => state.status !== 'off' && set({ status: 'error' }))
  return audio
}

export const getRadio = () => state
export const useRadio = () => useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), getRadio)

export function radioOn() {
  const a = element()
  a.src = STREAM // a fresh connection each time: a live stream has no past to resume
  a.volume = state.volume
  set({ status: 'loading', userOff: false })
  return a.play().catch((e) => {
    set({ status: e?.name === 'NotAllowedError' ? 'blocked' : 'error' })
    throw e
  })
}

export function radioOff({ byUser = false } = {}) {
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load() // drop the connection
  }
  set({ status: 'off', userOff: byUser || state.userOff })
}

// when the deferred start below ran on this very click, the click already
// meant "radio on": don't let the radio's own button turn it straight off
let autoStartedAt = -Infinity

export function toggleRadio() {
  if (performance.now() - autoStartedAt < 600) return
  if (state.status === 'off' || state.status === 'blocked' || state.status === 'error') radioOn().catch(() => {})
  else radioOff({ byUser: true })
}

export function setRadioVolume(volume) {
  const v = Math.min(1, Math.max(0, volume))
  if (audio) audio.volume = v
  set({ volume: v })
}

// Entering the boteco switches the radio on, unless the visitor turned it off.
// Browsers refuse sound before the visitor interacts with the page. On a
// phone only the END of a touch counts as that interaction (not the moment the
// finger lands), so wait for a touch release, click or key press, and keep
// trying on each one until the stream actually plays. Listened to in the
// capture phase, so a drag on the 3D scene counts too.
const UNLOCK = ['pointerup', 'touchend', 'click', 'keydown']
let pendingStart = null
export function startBotecoRadio() {
  if (state.userOff || state.status === 'playing' || state.status === 'loading') return
  radioOn().catch((e) => {
    if (e?.name !== 'NotAllowedError' || pendingStart) return
    let trying = false
    pendingStart = () => {
      if (state.status !== 'blocked' || state.userOff) return stopWaiting()
      if (trying) return
      trying = true
      autoStartedAt = performance.now()
      radioOn()
        .then(stopWaiting)
        .catch(() => {}) // still not allowed: the next touch tries again
        .finally(() => (trying = false))
    }
    for (const type of UNLOCK) addEventListener(type, pendingStart, { capture: true })
  })
}

function stopWaiting() {
  if (!pendingStart) return
  for (const type of UNLOCK) removeEventListener(type, pendingStart, { capture: true })
  pendingStart = null
}

export function leaveBotecoRadio() {
  stopWaiting()
  radioOff()
}
