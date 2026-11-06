import { useSyncExternalStore } from 'react'
import { newGame } from './pool'

// The match lives outside React so the 3D table (inside the Canvas) and the
// DOM scoreboard share it. notify() re-renders whoever called usePool().
export const pool = {
  game: newGame(),
  aim: { angle: 0, pull: 0, dragging: false, startX: 0, startY: 0 },
  playing: false,
}

let version = 0
const listeners = new Set()
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))

export function notify() {
  version++
  listeners.forEach((l) => l())
}

export function setPlaying(playing) {
  if (pool.playing === playing) return
  pool.playing = playing
  pool.aim.dragging = false
  pool.aim.pull = 0
  notify()
}

export function restart() {
  pool.game = newGame()
  pool.aim.angle = 0
  notify()
}

export function usePool() {
  useSyncExternalStore(subscribe, () => version)
  return pool
}
