import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { MODELS, DRACO } from '../Model'
import { Morph } from '../primitives'
import { LAYOUT } from '../layout'

// Desk top in the desk's own frame (metres, without its non-uniform scale):
// the lane between the monitor stand and the keyboard, end to end.
const DESK = LAYOUT.desk
const TOP = 0.795 * DESK.scale[1]
const LANE = { from: -0.7, to: 0.5, z: -0.07 } // stops short of the desk lamp on the left
const SPEED = 0.066 // m/s, an unhurried stroll
// The walk clip (Blender) is keyed for exactly this speed: planted feet move back
// at 0.066 m/s and the head holds still in space between thrusts, so play it 1:1.
const STRIDE_RATE = 1
// Things on the desk she stops to look at on the way (desk frame, scaled positions).
const CURIOSITIES = [
  { x: 0, z: 0.13 }, // keyboard
  { x: 0, z: -0.33 }, // monitor
  { x: 0.41, z: 0.15 }, // mouse
  { x: -0.57, z: 0.19 }, // mug
]
const rand = (a, b) => a + Math.random() * (b - a)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

// Soft round contact shadow that travels with her (the room's shadow maps are
// only redrawn when the scene changes, so a cast shadow would stay behind).
function blobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(0,0,0,0.55)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.25)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

// The cockatiel (Meshy model, rigged and animated in Blender) strolls along the
// desk. On the way she stops now and then to look at the keyboard, the monitor,
// the mouse or the mug; at each end she lingers, turns and walks back.
function Bird() {
  const { scene, animations } = useGLTF(MODELS.cockatiel, DRACO)
  const root = useRef()
  const bird = useMemo(() => {
    const b = cloneSkinned(scene)
    b.traverse((o) => {
      if (o.isMesh) o.frustumCulled = false // skinned: the bind-pose bounds don't follow the walk
    })
    return b
  }, [scene])
  const blob = useMemo(blobTexture, [])
  const { actions } = useAnimations(animations, root)
  const state = useRef({ x: LANE.from, dir: 1, mode: 'walk', until: 0, heading: Math.PI / 2, look: 0, nextStop: LANE.from + 0.3 })

  useEffect(() => {
    if (actions.walk) actions.walk.timeScale = STRIDE_RATE
    actions.walk?.reset().play()
  }, [actions])

  const fade = (to) => {
    const from = to === 'walk' ? actions.idle : actions.walk
    actions[to]?.reset().fadeIn(0.3).play()
    from?.fadeOut(0.3)
  }
  const planStop = (s) => (s.nextStop = s.x + s.dir * rand(0.2, 0.5))

  useFrame((three, delta) => {
    const s = state.current
    const t = three.clock.elapsedTime
    const dt = Math.min(delta, 0.1)
    const travel = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2
    let facing = travel
    if (s.mode === 'walk') {
      s.x += s.dir * SPEED * dt
      const end = s.dir > 0 ? LANE.to : LANE.from
      if ((s.dir > 0 && s.x >= end) || (s.dir < 0 && s.x <= end)) {
        // end of the desk: a long rest, looking around
        s.x = end
        s.mode = 'rest'
        s.until = t + rand(6, 10)
        fade('idle')
      } else if ((s.dir > 0 && s.x >= s.nextStop) || (s.dir < 0 && s.x <= s.nextStop)) {
        if (Math.random() < 0.7) {
          // something caught her eye: turn to it for a couple of seconds
          const c = CURIOSITIES[Math.floor(Math.random() * CURIOSITIES.length)]
          s.look = Math.atan2(c.x - s.x, c.z - LANE.z)
          s.mode = 'look'
          s.until = t + rand(1.5, 3.5)
          fade('idle')
        }
        planStop(s)
      }
    } else if (s.mode === 'look') {
      facing = s.look
      if (t > s.until) {
        s.mode = 'walk'
        fade('walk')
      }
    } else {
      facing = travel + 0.45 * Math.sin(t * 0.7)
      if (t > s.until) {
        s.dir = -s.dir
        s.mode = 'walk'
        planStop(s)
        fade('walk')
      }
    }
    // the model faces +z; turn the short way round, eased
    s.heading += wrap(facing - s.heading) * Math.min(1, dt * 4)
    root.current.position.set(s.x, TOP, LANE.z)
    root.current.rotation.y = s.heading
  })

  return (
    <group ref={root} userData={{ noMerge: true }}>
      <primitive object={bird} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.03]} scale={[0.13, 0.26, 1]} renderOrder={1}>
        <planeGeometry />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

export function WalkingCockatiel() {
  return (
    <Morph phase="day" delay={0.08} position={DESK.position} rotation={DESK.rotation}>
      <Suspense fallback={null}>
        <Bird />
      </Suspense>
    </Morph>
  )
}
