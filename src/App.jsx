import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Experience } from './scene/Experience'
import { timeState, autoMode } from './scene/state'
import { CAMERAS } from './scene/layout'
import { Hud } from './Hud'
import { PoolGame } from './game/PoolGame'
import { setPlaying as setPoolPlaying } from './game/store'
import { startBotecoRadio, leaveBotecoRadio } from './radio'

// Phones, touch-first devices and low core counts start in low quality.
// ?quality=low|high forces a tier (handy for testing).
function initialLowQuality() {
  const forced = new URLSearchParams(location.search).get('quality')
  if (forced) return forced === 'low'
  const coarse = matchMedia('(pointer: coarse)').matches
  return coarse || innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4
}

function initialMode() {
  const forced = new URLSearchParams(location.search).get('mode')
  return forced === 'day' || forced === 'night' ? forced : autoMode()
}

export default function App() {
  const [mode, setMode] = useState(() => {
    const m = initialMode()
    timeState.t = timeState.target = m === 'night' ? 1 : 0
    return m
  })

  // Debug: ?t=0.6 freezes the day→night transition at that point.
  const frozenT = useState(() => {
    const t = parseFloat(new URLSearchParams(location.search).get('t'))
    return Number.isFinite(t) ? t : null
  })[0]
  // A mode forced in the URL counts as the visitor's choice: no auto switching.
  const [manual, setManual] = useState(() => new URLSearchParams(location.search).has('mode'))
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get('focus'))
  const [low, setLow] = useState(initialLowQuality)
  // The day/night switch itself dips the frame rate for a moment; that must not
  // be read as a slow device (dropping quality rebuilds the effects and
  // recompiles shaders, which would make the hitch far worse). Neither is a
  // background tab, throttled by the browser. A quality forced in the URL is
  // never changed.
  const switchedAt = useRef(0)
  const onDecline = useCallback(() => {
    if (new URLSearchParams(location.search).has('quality') || document.hidden) return
    if (timeState.t !== timeState.target || performance.now() - switchedAt.current < 4000) return
    setLow(true)
  }, [])

  const firstMode = useRef(true)
  useEffect(() => {
    switchedAt.current = performance.now()
    timeState.target = mode === 'night' ? 1 : 0
    if (frozenT !== null) timeState.t = timeState.target = frozenT
    if (!firstMode.current) setSelected(null)
    firstMode.current = false
  }, [mode])

  // The boteco has its radio on; the office is quiet.
  useEffect(() => {
    if (mode === 'night') startBotecoRadio()
    else leaveBotecoRadio()
  }, [mode])

  // At 18h the office turns into the boteco on its own, unless the visitor chose a side.
  useEffect(() => {
    if (manual) return
    const id = setInterval(() => setMode(autoMode()), 30_000)
    return () => clearInterval(id)
  }, [manual])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelected(null)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // Clicking the pool table flies the camera over it, then the playable table
  // fades in on top (the "focus" effect) after the camera has arrived.
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (selected !== 'sinuca') return setPlaying(false)
    const id = setTimeout(() => setPlaying(true), 750)
    return () => clearTimeout(id)
  }, [selected])
  useEffect(() => setPoolPlaying(playing), [playing])
  const exitGame = useCallback(() => setSelected(null), [])

  const toggle = useCallback(() => {
    setManual(true)
    setMode((m) => (m === 'day' ? 'night' : 'day'))
  }, [])

  return (
    <>
      <Canvas
        shadows
        dpr={low ? [1, 1.25] : [1, 1.75]}
        camera={{ fov: CAMERAS[mode].fov, position: CAMERAS[mode].pos, near: 0.1, far: 80 }}
        onPointerMissed={() => setSelected(null)}
      >
        {/* drop to low quality if the frame rate keeps sagging */}
        <PerformanceMonitor onDecline={onDecline} flipflops={1} />
        <Experience selected={selected} onSelect={setSelected} low={low} mode={mode} />
      </Canvas>
      {playing ? <PoolGame onExit={exitGame} /> : <Hud mode={mode} selected={selected} onSelect={setSelected} onToggle={toggle} />}
    </>
  )
}
