import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { timeState, shadowState, lerp } from './state'
import { windowGoboTexture } from './textures'
import { WINDOW } from './Room'

const DAY_BG = new THREE.Color('#e6d6b8')
const NIGHT_BG = new THREE.Color('#0d0a08')
const DAY_HEMI_SKY = new THREE.Color('#fff4dc')
const NIGHT_HEMI_SKY = new THREE.Color('#5a4a7a')

const WIN_CENTER = [(WINDOW.x0 + WINDOW.x1) / 2, (WINDOW.y0 + WINDOW.y1) / 2]
// Where the morning sun lands on the floor (just in front of the desk).
export const SUN_SPOT = [0.4, 0, 1.6]
// The reading corner's armchair (lounge position): warm side light lands here.
const ARMCHAIR = [-1.33, 0.45, -0.97]

// Day: morning sun projected through the window panes (a spotlight with a
// window-shaped gobo, placed just inside the opening so the wall can't block it),
// a soft unshadowed key and sky fill.
// Night: warm lamp over the pool table, fluorescent tube over the bar.
export function Lighting({ low }) {
  const sun = useRef()
  const windowSun = useRef()
  const hemi = useRef()
  const poolLamp = useRef()
  const barTube = useRef()
  const shelfGlow = useRef()
  const fill = useRef()
  const ambient = useRef()
  const armchairGlow = useRef()
  const { scene } = useThree()
  if (!scene.background) scene.background = DAY_BG.clone()

  // The room is static, so shadow maps are only redrawn while something changes:
  // the first frames after (re)mount and during the day/night transition.
  const shadowFrames = useRef(0)
  useEffect(() => {
    shadowFrames.current = 0
  }, [low])
  // A long first frame of the switch can carry t straight to its end, so the
  // maps keep redrawing for a few frames after it settles (else the pool lamp
  // could be left with a map it never drew: a dark patch on the table).
  const settle = useRef(0)

  const armchairTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(...ARMCHAIR)
    return o
  }, [])

  const sunTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(...SUN_SPOT)
    return o
  }, [])

  useFrame((_, delta) => {
    if (timeState.t !== timeState.target) settle.current = 8
    const step = delta * 0.45
    const d = timeState.target - timeState.t
    timeState.t += Math.abs(d) < step ? d : Math.sign(d) * step
    const t = timeState.t
    const day = 1 - Math.min(1, t * 2)
    const night = Math.max(0, t * 2 - 1)

    sun.current.intensity = lerp(0, 1.1, day)
    windowSun.current.intensity = lerp(0, 82, day)
    armchairGlow.current.intensity = lerp(0, 70, day)
    hemi.current.intensity = lerp(0.3, 0.95, 1 - t)
    hemi.current.color.lerpColors(DAY_HEMI_SKY, NIGHT_HEMI_SKY, t)
    ambient.current.intensity = lerp(0.08, 0.18, 1 - t)
    scene.environmentIntensity = lerp(0.18, 0.7, 1 - t)
    poolLamp.current.intensity = lerp(0, 55, night)
    barTube.current.intensity = lerp(0, 15, night)
    shelfGlow.current.intensity = lerp(0, 1.1, night)
    fill.current.intensity = lerp(0, 10, night)
    scene.background.lerpColors(DAY_BG, NIGHT_BG, t)

    const changing = shadowFrames.current++ < 10 || settle.current-- > 0
    for (const light of [windowSun.current, armchairGlow.current, poolLamp.current]) {
      light.shadow.autoUpdate = false
      if (changing && light.intensity > 0) light.shadow.needsUpdate = true
    }
    // balls rolling or the cue moving: keep the lamp's shadows following them
    if (shadowState.pool > 0) {
      shadowState.pool--
      if (poolLamp.current.intensity > 0) poolLamp.current.shadow.needsUpdate = true
    }
  })

  return (
    <>
      {/* soft image-based fill + reflections: a warm ceiling panel and the bright window */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.2} color="#fff1dc" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#ffe6bf" position={[1.7, 2, -6]} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#c8d8ff" position={[6, 2, 4]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <hemisphereLight ref={hemi} args={['#fff4dc', '#8a6a4a', 1.0]} />
      <ambientLight ref={ambient} color="#ffe9c8" intensity={0.35} />
      <directionalLight ref={sun} position={[-6.5, 5.2, -12]} color="#ffe2b0" />

      <primitive object={sunTarget} />
      {/* soft afternoon light raking across the cream armchair, as in the
          office reference: wide penumbra, its shadow drawn once like the others */}
      <primitive object={armchairTarget} />
      <spotLight
        ref={armchairGlow}
        position={[ARMCHAIR[0] + 1.9, 2.1, ARMCHAIR[2] + 0.15]}
        target={armchairTarget}
        angle={0.55}
        penumbra={1}
        decay={1.6}
        distance={5}
        color="#ffd9a8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <spotLight
        ref={windowSun}
        position={[WIN_CENTER[0] - 0.3, WIN_CENTER[1] + 0.9, -4.35]}
        target={sunTarget}
        map={windowGoboTexture()}
        angle={0.62}
        penumbra={0.15}
        decay={1.3}
        color="#ffdca0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={0.3}
      />

      <spotLight
        key={`lamp-${low}`}
        ref={poolLamp}
        position={[0, 2.15, 0]}
        angle={0.95}
        penumbra={0.6}
        color="#fff1d0"
        castShadow
        shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
        // small offsets: a normal bias bigger than a ball (2.75 cm) pushed and
        // shrank the balls' shadows into detached crescents
        shadow-bias={-0.0003}
        shadow-normalBias={0.004}
        target-position={[0, 0, 0]}
      />
      <pointLight ref={barTube} position={[2.6, 3.0, 0.2]} color="#fff3e2" distance={10} />
      {/* the warm tube over the bottles lights just its own corner */}
      <pointLight ref={shelfGlow} position={[4.2, 2.95, 0.75]} color="#ffc27a" distance={2.2} decay={2} />
      <pointLight ref={fill} position={[-1.5, 3.0, -2.4]} color="#ffcf8a" distance={10} />
    </>
  )
}
