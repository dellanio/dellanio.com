import React, { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { MODELS, DRACO } from '../Model'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Box, Ball, Cyl, Panel, Morph } from '../primitives'
import { LAYOUT } from '../layout'
import { wallSignTexture, woodTexture, calendarTexture, sketchTexture, notebookTexture } from '../textures'
import { timeState, lerp } from '../state'

// Fixtures on the back wall, left of the window.

// Oscillating wall fan (Blender model with articulated head and blades).
// Idle in the morning, spinning in the boteco.
function FanModel() {
  const { scene } = useGLTF(MODELS.wallFan, DRACO)
  const { root, head, blades } = useMemo(() => {
    const root = scene.clone(true)
    root.userData.noMerge = true // head and blades animate; the enclosing Morph must not bake them
    root.traverse((o) => {
      if (o.isMesh) o.castShadow = o.receiveShadow = true
    })
    return { root, head: root.getObjectByName('fan_head'), blades: root.getObjectByName('fan_blades') }
  }, [scene])
  useFrame((state, delta) => {
    const t = timeState.t
    blades.rotation.z += delta * lerp(0.3, 14, t)
    head.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5 * t
  })
  return <primitive object={root} />
}

export function WallFan() {
  return (
    <>
      <Morph phase="night" delay={0.04} {...LAYOUT.fan}>
        <Suspense fallback={null}>
          <FanModel />
        </Suspense>
      </Morph>
      <Morph phase="day" delay={0.04} {...LAYOUT.dayFan}>
        <Suspense fallback={null}>
          <FanModel />
        </Suspense>
      </Morph>
    </>
  )
}

export function Calendar() {
  return (
    <>
      <Morph phase="night" delay={0.05} {...LAYOUT.calendar}>
        <Panel size={[0.4, 0.53]} map={calendarTexture()} />
      </Morph>
      <Morph phase="day" delay={0.05} {...LAYOUT.dayCalendar}>
        <Panel size={[0.4, 0.53]} map={calendarTexture()} />
      </Morph>
    </>
  )
}

// Recife street photo for the pegboard: a crop of the window's picture.
let photo
function recifePhoto() {
  if (!photo) {
    photo = new THREE.TextureLoader().load('/textures/recife_day.jpg')
    photo.colorSpace = THREE.SRGBColorSpace
    photo.repeat.set(0.3, 0.62)
    photo.offset.set(0.47, 0.22)
  }
  return photo
}

const BOARD = { w: 0.9, h: 1.7 }
const FRONT = 0.03

function Pin({ color = '#c8553d', ...props }) {
  return <Ball r={0.009} color={color} mat={{ roughness: 0.3 }} {...props} />
}

// Sheet of paper hung on the board, with a pin (or a binder clip) at the top.
function Sheet({ size, map, clip = false, tilt = 0, position }) {
  const [w, h] = size
  return (
    <group position={[position[0], position[1], FRONT + 0.003]} rotation={[0, 0, tilt]}>
      <Box size={[w, h, 0.002]} shadows={false}>
        <meshStandardMaterial map={map} roughness={0.9} />
      </Box>
      {clip ? (
        <group position={[0, h / 2 - 0.005, 0.006]}>
          <Box size={[0.05, 0.025, 0.01]} color="#1e1e1e" mat={{ metalness: 0.5, roughness: 0.35 }} />
          <Cyl r={0.002} h={0.04} color="#bdbdbd" position={[0, 0.02, 0.004]} rotation={[0, 0, Math.PI / 2]} mat={{ metalness: 0.9, roughness: 0.2 }} />
        </group>
      ) : (
        <Pin position={[0, h / 2 - 0.02, 0.008]} />
      )}
    </group>
  )
}

// Over-ear headphones hanging from a peg.
function Headphones(props) {
  return (
    <group {...props}>
      <Cyl r={0.004} h={0.05} color="#9a9a9a" position={[0, 0.1, 0.02]} rotation={[Math.PI / 2, 0, 0]} mat={{ metalness: 0.8, roughness: 0.3 }} />
      <mesh position={[0, 0.0, 0.03]} castShadow>
        <torusGeometry args={[0.085, 0.011, 10, 40, Math.PI]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.085, -0.035, 0.03]}>
          <Cyl r={0.006} h={0.05} color="#2a2a2a" position={[0, 0.02, 0]} />
          <Box radius={0.03} size={[0.045, 0.1, 0.075]} position={[0, -0.03, 0]} color="#161616" mat={{ roughness: 0.55 }} />
          <Box radius={0.025} size={[0.02, 0.085, 0.065]} position={[-s * 0.02, -0.03, 0]} color="#2b2b2b" mat={{ roughness: 0.9 }} />
        </group>
      ))}
    </group>
  )
}

// Kraft spiral notebook hanging from two pegs.
function Notebook(props) {
  const w = 0.24
  const h = 0.32
  return (
    <group {...props}>
      <Box size={[w, h, 0.012]} position={[0, 0, FRONT + 0.008]}>
        <meshStandardMaterial map={notebookTexture()} roughness={0.85} />
      </Box>
      <Box size={[w - 0.01, h - 0.01, 0.008]} position={[0.004, -0.004, FRONT + 0.001]} color="#efe9dc" shadows={false} />
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.012, h / 2 - 0.02 - i * 0.021, FRONT + 0.012]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.007, 0.0016, 6, 12]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Little shelf on two pegs with a pen cup, markers and an eraser.
function PenShelf(props) {
  const pens = ['#e07a5f', '#3d405b', '#81b29a', '#f2c14e', '#111111', '#5fa8d3']
  return (
    <group {...props}>
      <Box size={[0.32, 0.018, 0.1]} position={[0, 0, FRONT + 0.05]} color="#c49a6c" />
      <Box size={[0.32, 0.05, 0.01]} position={[0, 0.016, FRONT + 0.098]} color="#c49a6c" />
      <Cyl r={0.032} h={0.08} color="#2f4f4f" position={[-0.08, 0.049, FRONT + 0.05]} />
      {pens.map((c, i) => (
        <Cyl key={c} r={0.0045} h={0.14} color={c} position={[-0.1 + (i % 3) * 0.018, 0.1, FRONT + 0.04 + Math.floor(i / 3) * 0.02]} rotation={[0.08 * (i % 2 ? 1 : -1), 0, 0.1 * ((i % 3) - 1)]} />
      ))}
      {['#e63946', '#2a9d8f', '#f4a261'].map((c, i) => (
        <Cyl key={c} r={0.008} h={0.1} color={c} position={[0.03 + i * 0.024, 0.059, FRONT + 0.05]} />
      ))}
      <Box radius={0.004} size={[0.05, 0.016, 0.025]} position={[0.12, 0.017, FRONT + 0.05]} color="#f4f1de" />
    </group>
  )
}

// Office pegboard (day), after the reference: sketches of Recife's facades,
// a street photo, headphones, a pen shelf and a notebook. The cue rack at night.
export function Pegboard() {
  return (
    <Morph phase="day" delay={0.1} {...LAYOUT.pegboard}>
      <Box radius={0.012} size={[BOARD.w, BOARD.h, 0.03]} position={[0, 0, 0.015]} color="#c8935c" mat={{ roughness: 0.75 }} />
      {Array.from({ length: 27 }, (_, j) =>
        Array.from({ length: 14 }, (_, i) => (
          <Box key={`${i}-${j}`} size={[0.011, 0.011, 0.002]} position={[-0.39 + i * 0.06, -0.78 + j * 0.06, FRONT + 0.001]} color="#5a3a1e" shadows={false} />
        )),
      )}
      <Sheet size={[0.42, 0.33]} map={sketchTexture('facade')} position={[-0.13, 0.55]} />
      <group position={[0.27, 0.56, FRONT + 0.004]} rotation={[0, 0, -0.03]}>
        <Box size={[0.2, 0.27, 0.003]} color="#ffffff" shadows={false} />
        <mesh position={[0, 0.012, 0.002]}>
          <planeGeometry args={[0.18, 0.22]} />
          <meshStandardMaterial map={recifePhoto()} roughness={0.6} />
        </mesh>
        <Pin color="#3d6fb4" position={[0, 0.12, 0.008]} />
      </group>
      <Headphones position={[0.25, 0.06, 0]} scale={1.35} />
      <Sheet size={[0.24, 0.29]} map={sketchTexture('church')} clip tilt={0.02} position={[-0.2, 0.06]} />
      <Sheet size={[0.13, 0.15]} map={sketchTexture('church')} tilt={-0.05} position={[-0.06, -0.2]} />
      <PenShelf position={[-0.18, -0.5, 0]} />
      <Notebook position={[0.2, -0.42, 0]} />
      {/* peg hooks under the shelf and notebook */}
      {[
        [-0.3, -0.505],
        [-0.06, -0.505],
        [0.12, -0.25],
        [0.28, -0.25],
      ].map(([x, y]) => (
        <Cyl key={`${x}${y}`} r={0.004} h={0.04} color="#9a9a9a" position={[x, y, FRONT + 0.02]} rotation={[Math.PI / 2, 0, 0]} mat={{ metalness: 0.8, roughness: 0.3 }} />
      ))}
    </Morph>
  )
}

export function DaySign() {
  return (
    <Morph phase="day" delay={0.14} {...LAYOUT.daySign}>
      {/* cream board in a walnut frame */}
      <Box size={[1.56, 0.4, 0.02]} position={[0, 0, 0.01]} color="#ece6d6" />
      <Panel size={[1.5, 0.375]} map={wallSignTexture()} position={[0, 0, 0.021]} />
      {[
        [[1.62, 0.035, 0.035], [0, 0.2175, 0.018]],
        [[1.62, 0.035, 0.035], [0, -0.2175, 0.018]],
        [[0.035, 0.47, 0.035], [-0.7925, 0, 0.018]],
        [[0.035, 0.47, 0.035], [0.7925, 0, 0.018]],
      ].map(([size, position], i) => (
        <Box key={i} size={size} position={position}>
          <meshStandardMaterial map={woodTexture()} color="#f3c9a0" roughness={0.5} />
        </Box>
      ))}
    </Morph>
  )
}
