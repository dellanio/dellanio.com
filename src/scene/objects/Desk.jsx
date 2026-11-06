import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Box, Cyl, Panel, Morph, Hotspot } from '../primitives'
import { LAYOUT } from '../layout'
import { cvTexture } from '../textures'
import { Model } from '../Model'
import { DeskLamp } from './CoffeeCorner'

const WOOD = '#6b4226'
const METAL = '#2b2b2b'

function Monitor() {
  return (
    <group position={[0, 0.795, -0.3]}>
      <Box size={[0.34, 0.02, 0.22]} position={[0, 0.01, 0]} color="#d8d8d8" mat={{ metalness: 0.6, roughness: 0.3 }} />
      <Box size={[0.07, 0.36, 0.05]} position={[0, 0.19, -0.02]} color="#d8d8d8" mat={{ metalness: 0.6, roughness: 0.3 }} />
      <Box radius={0.016} size={[1.04, 0.64, 0.035]} position={[0, 0.6, 0]} color="#e8e8e8" mat={{ metalness: 0.3, roughness: 0.4 }} />
      <Panel size={[0.98, 0.575]} map={cvTexture()} lit position={[0, 0.61, 0.019]} />
    </group>
  )
}

// Glazed ceramic mug: lathe-turned body with a real wall and rounded lip,
// coffee inside and a C handle (a half torus) meeting the side.
const MUG_PROFILE = [
  [0, 0], [0.038, 0], [0.0425, 0.004], [0.044, 0.012], [0.044, 0.096], [0.0436, 0.1], [0.041, 0.1012],
  [0.0395, 0.0985], [0.0395, 0.012], [0, 0.009],
].map(([x, y]) => new THREE.Vector2(x, y))
const mugGeometry = new THREE.LatheGeometry(MUG_PROFILE, 48)
const CERAMIC = { color: '#eceae4', roughness: 0.22 }

function Mug(props) {
  return (
    <group {...props}>
      <mesh geometry={mugGeometry} castShadow receiveShadow>
        <meshStandardMaterial {...CERAMIC} side={THREE.DoubleSide} />
      </mesh>
      <Cyl r={0.0396} h={0.002} seg={48} color="#2a1a10" position={[0, 0.084, 0]} mat={{ roughness: 0.12 }} />
      <mesh position={[0.042, 0.053, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1.12, 1, 1]} castShadow>
        <torusGeometry args={[0.025, 0.0065, 12, 32, Math.PI]} />
        <meshStandardMaterial {...CERAMIC} />
      </mesh>
    </group>
  )
}

function DeskTop() {
  return (
    <group>
      <Box radius={0.03} size={[2.6, 0.07, 1.25]} position={[0, 0.76, 0]} color={WOOD} mat={{ roughness: 0.6 }} />
      {/* steel trestle legs */}
      {[-1.15, 1.15].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box size={[0.06, 0.725, 0.06]} position={[0, 0.3625, 0.5]} color={METAL} />
          <Box size={[0.06, 0.725, 0.06]} position={[0, 0.3625, -0.5]} color={METAL} />
          <Box size={[0.06, 0.06, 1.06]} position={[0, 0.03, 0]} color={METAL} />
          <Box size={[0.06, 0.06, 1.06]} position={[0, 0.7, 0]} color={METAL} />
        </group>
      ))}
    </group>
  )
}

function Clutter() {
  return (
    <group position={[0, 0.795, 0]}>
      {/* keyboard and mouse */}
      <Box radius={0.009} size={[0.62, 0.022, 0.19]} position={[0, 0.011, 0.12]} color="#f2f2f2" />
      <Box radius={0.012} size={[0.07, 0.025, 0.11]} position={[0.45, 0.012, 0.14]} color="#f2f2f2" />
      <Mug position={[-0.62, 0, 0.18]} rotation={[0, -0.88, 0]} />
      {/* notebook with pen */}
      <Box radius={0.006} size={[0.3, 0.025, 0.22]} position={[-0.32, 0.013, 0.38]} rotation={[0, 0.15, 0]} color="#1f1f1f" />
      <Cyl r={0.006} h={0.16} color="#c0a060" position={[-0.3, 0.032, 0.37]} rotation={[0, 0, Math.PI / 2]} />
      {/* pen cup */}
      <Cyl r={0.045} h={0.11} color="#c9d6de" position={[0.75, 0.055, -0.25]} mat={{ transparent: true, opacity: 0.8 }} />
      {['#e07a5f', '#3d405b', '#81b29a'].map((c, i) => (
        <Cyl key={c} r={0.005} h={0.16} color={c} position={[0.74 + i * 0.012, 0.13, -0.25]} rotation={[0.1 * (i - 1), 0, 0.12 * (i - 1)]} />
      ))}
      {/* stacked books */}
      <Box radius={0.008} size={[0.32, 0.035, 0.24]} position={[0.85, 0.018, 0.25]} color="#f2c14e" />
      <Box radius={0.008} size={[0.3, 0.035, 0.22]} position={[0.85, 0.053, 0.25]} rotation={[0, 0.1, 0]} color="#5fa8d3" />
      {/* small succulent (Poly Haven) */}
      <Model name="succulent" position={[1.08, 0, -0.38]} scale={0.9} />

    </group>
  )
}

const DESK_SCREENS = { screen: cvTexture() }
// Satin oiled oak, as in the reference: the GLB's glossy roughness map turned
// the window sun (behind the desk, facing the camera) into a mirror glare.
const DESK_MATERIALS = { oak_wood_planks: { roughnessMap: null, roughness: 0.68, envMapIntensity: 0.8 } }

export function Desk() {
  return (
    <Morph phase="day" {...LAYOUT.desk}>
      <Hotspot id="curriculo" label="Currículo" marker={[0, 1.65, -0.3]}>
        <Model
          name="desk"
          screens={DESK_SCREENS}
          materials={DESK_MATERIALS}
          fallback={
            <>
              <DeskTop />
              <Monitor />
            </>
          }
        />
        <Clutter />
      </Hotspot>
    </Morph>
  )
}

function OfficeChairFallback() {
  return (
    <>
      <Box radius={0.03} size={[0.52, 0.07, 0.5]} position={[0, 0.5, 0]} color="#222" />
      <Box radius={0.024} size={[0.5, 0.62, 0.05]} position={[0, 0.88, 0.27]} rotation={[-0.12, 0, 0]} color="#1b1b1b" />
      {[-0.29, 0.29].map((x) => (
        <Box key={x} size={[0.05, 0.04, 0.32]} position={[x, 0.68, 0.02]} color="#222" />
      ))}
      <Cyl r={0.03} h={0.4} color="#888" position={[0, 0.27, 0]} mat={{ metalness: 0.7, roughness: 0.3 }} />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box size={[0.03, 0.03, 0.3]} position={[0, 0.07, 0.15]} color="#333" />
            <Cyl r={0.025} h={0.03} color="#111" position={[0, 0.03, 0.29]} rotation={[0, 0, Math.PI / 2]} />
          </group>
        )
      })}
    </>
  )
}

// The black desk lamp at the left-hand end of the desk, behind the cockatiel's
// turning point, its head leaning out over the front edge. Its own group: the desk's non-uniform scale would distort it.
export function DeskLampOnDesk() {
  const top = 0.795 * LAYOUT.desk.scale[1]
  return (
    <Morph phase="day" delay={0.06} position={LAYOUT.desk.position} rotation={LAYOUT.desk.rotation}>
      <DeskLamp position={[-1.06, top, -0.36]} rotation={[0, -1.25, 0]} />
    </Morph>
  )
}

// Mac mini (2024) to the left of the monitor: a 12.7 cm square of brushed
// aluminium, 5 cm tall, rounded corners, the dark Apple logo on top, two USB-C
// ports, the headphone jack and the power light at the front, a dark rubber
// foot, and its cable looping off the back towards the monitor.
let appleLogo
function appleLogoTexture() {
  if (appleLogo) return appleLogo
  const c = document.createElement('canvas')
  c.width = 100
  c.height = 110
  const g = c.getContext('2d')
  g.fillStyle = '#1c1c1e'
  g.beginPath()
  g.moveTo(50, 34)
  g.bezierCurveTo(40, 26, 18, 26, 12, 46)
  g.bezierCurveTo(5, 66, 15, 94, 30, 102)
  g.bezierCurveTo(38, 107, 44, 102, 50, 102)
  g.bezierCurveTo(56, 102, 62, 107, 70, 102)
  g.bezierCurveTo(80, 96, 86, 86, 89, 78)
  g.bezierCurveTo(78, 72, 74, 56, 86, 48)
  g.bezierCurveTo(80, 36, 66, 28, 50, 34)
  g.fill()
  g.beginPath()
  g.ellipse(60, 16, 7, 14, 0.65, 0, Math.PI * 2)
  g.fill()
  appleLogo = new THREE.CanvasTexture(c)
  appleLogo.colorSpace = THREE.SRGBColorSpace
  return appleLogo
}

const MAC = 0.127
const MAC_H = 0.05
// cool silver: a fully metallic finish mirrored the warm room and read as bronze
const ALU = { color: '#e4e6ea', metalness: 0.45, roughness: 0.36 }

function MacMini(props) {
  const cable = useMemo(() => {
    // out of the back, a short loop, then along the desk behind it to the monitor's foot
    const curve = new THREE.CatmullRomCurve3([
      [0.035, 0.02, -MAC / 2],
      [0.045, 0.034, -MAC / 2 - 0.028],
      [0.085, 0.018, -MAC / 2 - 0.05],
      [0.17, 0.004, -MAC / 2 - 0.055],
      [0.28, 0.004, -MAC / 2 - 0.045],
      [0.36, 0.004, -MAC / 2 - 0.04],
    ].map((p) => new THREE.Vector3(...p)))
    return new THREE.TubeGeometry(curve, 60, 0.0032, 8, false)
  }, [])
  return (
    <group {...props}>
      {/* dark rubber foot, slightly inset */}
      <Box radius={0.01} size={[MAC - 0.012, 0.004, MAC - 0.012]} position={[0, 0.002, 0]} color="#1a1a1a" mat={{ roughness: 0.8 }} />
      <Box radius={0.012} size={[MAC, MAC_H - 0.003, MAC]} position={[0, 0.003 + (MAC_H - 0.003) / 2, 0]} color={ALU.color} mat={ALU} />
      <mesh position={[0, MAC_H + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.022, 0.0242]} />
        <meshStandardMaterial map={appleLogoTexture()} transparent roughness={0.25} metalness={0.3} />
      </mesh>
      {/* front: two USB-C, the headphone jack, the power light */}
      {[-0.03, -0.017].map((x) => (
        <Box key={x} radius={0.0012} size={[0.009, 0.0032, 0.001]} position={[x, 0.016, MAC / 2 + 0.0002]} color="#141414" />
      ))}
      <Cyl r={0.0018} h={0.001} seg={12} color="#141414" position={[-0.003, 0.016, MAC / 2 + 0.0002]} rotation={[Math.PI / 2, 0, 0]} />
      <Cyl r={0.0011} h={0.001} seg={10} color="#ffffff" position={[0.05, 0.016, MAC / 2 + 0.0002]} rotation={[Math.PI / 2, 0, 0]} mat={{ emissive: '#ffffff', emissiveIntensity: 1.2 }} />
      <mesh geometry={cable} castShadow>
        <meshStandardMaterial color="#141414" roughness={0.55} />
      </mesh>
    </group>
  )
}

// Its own group, like the lamp, so the desk's non-uniform scale doesn't squash it.
export function DeskMacMini() {
  const [sx, sy, sz] = LAYOUT.desk.scale
  return (
    <Morph phase="day" delay={0.06} position={LAYOUT.desk.position} rotation={LAYOUT.desk.rotation}>
      <MacMini position={[-0.42 * sx, 0.795 * sy, -0.24 * sz]} rotation={[0, 0.06, 0]} />
    </Morph>
  )
}

export function OfficeChair() {
  return (
    <Morph phase="day" delay={0.05} {...LAYOUT.chair}>
      <Model name="officeChair" fallback={<OfficeChairFallback />} />
    </Morph>
  )
}

// Chunky jute/sisal rug: rows of twisted cords in a herringbone (our own
// generated colour + normal maps, about 48 cm per tile) inside a cotton binding.
const RUG = [3.8, 2.8]
// Plain sisal colour until the maps arrive (an unloaded map samples black).
let jute
function juteMaterial() {
  if (!jute) {
    jute = new THREE.MeshStandardMaterial({ color: '#b39468', roughness: 0.97, normalScale: new THREE.Vector2(0.75, 0.75) })
    const load = (url, key) =>
      new THREE.TextureLoader().load(url, (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set((RUG[0] - 0.1) / 0.48, (RUG[1] - 0.1) / 0.48)
        t.anisotropy = 8
        if (key === 'map') {
          t.colorSpace = THREE.SRGBColorSpace
          jute.color.set('#ffffff')
        }
        jute[key] = t
        jute.needsUpdate = true
      })
    load('/textures/jute_diff.jpg', 'map')
    load('/textures/jute_normal.jpg', 'normalMap')
  }
  return jute
}

export function Rug() {
  return (
    <Morph phase="day" delay={0.1} {...LAYOUT.rug}>
      <Box radius={0.006} size={[RUG[0], 0.014, RUG[1]]} position={[0, 0.007, 0]} color="#8f7350" shadows={false} mat={{ roughness: 1 }} />
      <mesh position={[0, 0.0145, 0]} rotation={[-Math.PI / 2, 0, 0]} material={juteMaterial()} receiveShadow>
        <planeGeometry args={[RUG[0] - 0.1, RUG[1] - 0.1]} />
      </mesh>
    </Morph>
  )
}
