import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Model } from '../Model'
import { BeerBottle } from './NightWall'
import { ShelfRadio } from './Radio'
import { Box, Ball, Cyl, Morph, Panel, PhaseLight } from '../primitives'
import { crateLabel } from '../textures'
import { LAYOUT } from '../layout'

const GLASS = { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }
const BOTTLES = ['#5a2e0e', '#2e5a1e', '#6b3a10', '#c9b27a', '#3b1f0b', '#7a1c1c', '#d8c8a0']

export function Bottle({ color = '#5a2e0e', h = 0.26, r = 0.032, ...props }) {
  return (
    <group {...props}>
      <Cyl r={r} h={h * 0.62} color={color} position={[0, h * 0.31, 0]} mat={{ roughness: 0.15, metalness: 0.1 }} />
      <Cyl r={r * 0.4} rTop={r * 0.35} h={h * 0.3} color={color} position={[0, h * 0.77, 0]} mat={{ roughness: 0.15 }} />
      <Cyl r={r * 0.42} h={h * 0.04} color="#c9a227" position={[0, h * 0.94, 0]} />
      <Cyl r={r * 1.01} h={h * 0.2} color="#efe3cc" position={[0, h * 0.32, 0]} />
    </group>
  )
}

// Glass display case of salgados (coxinhas and pastéis) on the counter, lit inside.
function SnackCase(props) {
  return (
    <group {...props}>
      <Model name="snackCase" fallback={<SnackCaseFallback />} />
      <PhaseLight phase="night" position={[0, 0.3, 0]} color="#ffd9a0" intensity={0.6} distance={1.2} />
    </group>
  )
}

// Procedural stand-in while the model loads.
function SnackCaseFallback(props) {
  return (
    <group {...props}>
      <Box size={[0.95, 0.03, 0.42]} position={[0, 0.015, 0]} color="#bdbdbd" mat={{ metalness: 0.7, roughness: 0.3 }} />
      <Box size={[0.95, 0.34, 0.42]} position={[0, 0.2, 0]} shadows={false}>
        <meshStandardMaterial color="#dff3ff" {...GLASS} />
      </Box>
      <Box size={[0.95, 0.03, 0.42]} position={[0, 0.385, 0]} color="#bdbdbd" mat={{ metalness: 0.7, roughness: 0.3 }} />
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-0.36 + i * 0.12, 0.08, 0.05 * (i % 2 ? 1 : -1)]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[0.04, 0.09, 12]} />
          <meshStandardMaterial color="#d98a2b" roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <Box key={i} size={[0.16, 0.025, 0.09]} position={[-0.3 + i * 0.2, 0.2, -0.08]} rotation={[0, 0.2 * (i - 1.5), 0]} color="#e8b45a" />
      ))}
    </group>
  )
}

function Jar({ fill, ...props }) {
  return (
    <group {...props}>
      <Cyl r={0.08} h={0.24} color="#e8f6ff" position={[0, 0.12, 0]} mat={GLASS} />
      <Cyl r={0.083} h={0.04} color="#c9a227" position={[0, 0.26, 0]} />
      {Array.from({ length: 9 }, (_, i) => (
        <Ball key={i} r={0.025} color={fill} position={[Math.cos(i * 2.1) * 0.04, 0.03 + Math.floor(i / 3) * 0.045, Math.sin(i * 2.1) * 0.04]} />
      ))}
    </group>
  )
}

// Tiled bar counter with granite top, same footprint as the day sideboard.
export function BarCounter() {
  return (
    <Morph phase="night" delay={0.04} {...LAYOUT.bar}>
      <Model
        name="barCounter"
        fallback={
          <>
            <Box radius={0.02} size={[3.0, 0.98, 0.64]} position={[0, 0.49, 0]} color="#5a3a26" />
            <Box radius={0.025} size={[3.12, 0.06, 0.76]} position={[0, 1.01, 0.02]} color="#8c8378" mat={{ roughness: 0.3 }} />
          </>
        }
      />
      <group position={[0, 1.04, 0]}>
        <SnackCase position={[-0.92, 0, 0]} />
        {/* conservas: ovos de codorna and pepino with pimenta, in brine (Blender) */}
        <Model
          name="jars"
          fallback={
            <>
              <Jar fill="#f4f1de" position={[0.1, 0, 0.05]} />
              <Jar fill="#5f8a3a" position={[0.36, 0, -0.05]} />
            </>
          }
        />
        <Bottle color="#e63946" h={0.18} r={0.02} position={[0.62, 0, 0.12]} />
        <Bottle color="#f2c230" h={0.18} r={0.02} position={[0.72, 0, 0.1]} />
        {/* napkin box, glass jar and the sink tap near the corner */}
        <Box size={[0.3, 0.02, 0.2]} position={[-1.64, 0.01, 0.1]} color="#6b4a2b" />
        <Box size={[0.22, 0.14, 0.14]} position={[-1.9, 0.07, 0.05]} color="#2a2a2a" />
        <Cyl r={0.012} h={0.3} color="#cfcfcf" position={[-2.1, 0.15, -0.2]} mat={{ metalness: 0.9, roughness: 0.2 }} />
        <Cyl r={0.01} h={0.18} color="#cfcfcf" position={[-2.1, 0.3, -0.12]} rotation={[Math.PI / 2, 0, 0]} mat={{ metalness: 0.9, roughness: 0.2 }} />
      </group>
    </Morph>
  )
}

// Shelves of cachaça and whisky bottles plus an old radio.
export function BottleShelf() {
  return (
    <>
      <Morph phase="night" delay={0.12} {...LAYOUT.bottleShelf}>
        <Model name="bottleShelf" fallback={<BottleShelfFallback />} />
        {/* the potted plant at the end of the top shelf, as in the photo */}
        <Model name="plantWide" position={[0.56, 2.57, 0]} scale={0.45} />
        <ShelfRadio />
      </Morph>
      <Morph phase="night" delay={0.14} {...LAYOUT.bottleShelf2}>
        <Model name="bottleShelf" />
      </Morph>
    </>
  )
}

function BottleShelfFallback() {
  const rows = useMemo(
    () =>
      [1.55, 2.05, 2.55].map((y, j) =>
        Array.from({ length: 9 }, (_, i) => ({
          y,
          x: -0.5 + i * 0.125,
          color: BOTTLES[(i * 3 + j * 5) % BOTTLES.length],
          h: 0.24 + ((i + j) % 3) * 0.04,
        })),
      ),
    [],
  )
  return (
    <>
      {rows.map((row, j) => (
        <group key={j}>
          <Box size={[1.2, 0.04, 0.3]} position={[0, row[0].y, 0]} color="#5a3a26" />
          <Box size={[0.03, 0.12, 0.25]} position={[-0.45, row[0].y - 0.08, -0.02]} color="#2b2b2b" />
          <Box size={[0.03, 0.12, 0.25]} position={[0.45, row[0].y - 0.08, -0.02]} color="#2b2b2b" />
          {row.map((b, i) => (j === 2 && i < 3 ? null : <Bottle key={i} color={b.color} h={b.h} position={[b.x, b.y + 0.02, 0]} />))}
        </group>
      ))}
      {/* radio */}
      <group position={[-0.32, 2.57, 0.02]}>
        <Box radius={0.02} size={[0.36, 0.2, 0.14]} position={[0, 0.1, 0]} color="#8a6a48" />
        <Box size={[0.16, 0.14, 0.005]} position={[-0.07, 0.1, 0.072]} color="#3a2a1d" />
        <Cyl r={0.025} h={0.02} color="#d8c8a0" position={[0.11, 0.12, 0.075]} rotation={[Math.PI / 2, 0, 0]} />
        <Cyl r={0.004} h={0.3} color="#999" position={[0.12, 0.33, 0]} rotation={[0, 0, -0.4]} />
      </group>
    </>
  )
}

// Glass-door beer fridge, lit from inside.
// Frosted door glass: clear in the middle with a light fog, frost creeping in
// from the frame (heaviest at the bottom corners) and a scatter of droplets.
let frost
function frostTexture() {
  if (frost) return frost
  const w = 256
  const h = 512
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  let s = 7
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  g.fillStyle = 'rgba(232,244,255,0.06)'
  g.fillRect(0, 0, w, h)
  const edge = (x0, y0, x1, y1, a) => {
    const grad = g.createLinearGradient(x0, y0, x1, y1)
    grad.addColorStop(0, `rgba(240,248,255,${a})`)
    grad.addColorStop(1, 'rgba(240,248,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
  }
  edge(0, 0, w * 0.22, 0, 0.55)
  edge(w, 0, w * 0.78, 0, 0.55)
  edge(0, 0, 0, h * 0.12, 0.45)
  edge(0, h, 0, h * 0.72, 0.75)
  // feathery frost crystals along the frame
  for (let i = 0; i < 900; i++) {
    const side = rnd()
    const x = side < 0.5 ? (side < 0.25 ? rnd() * w * 0.16 : w - rnd() * w * 0.16) : rnd() * w
    const y = side < 0.5 ? rnd() * h : h - rnd() ** 2 * h * 0.3
    const len = 3 + rnd() * 9
    const a = rnd() * Math.PI
    g.strokeStyle = `rgba(250,253,255,${0.15 + rnd() * 0.35})`
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    g.stroke()
  }
  // condensation droplets
  for (let i = 0; i < 160; i++) {
    const x = rnd() * w
    const y = rnd() * h
    const r = 0.8 + rnd() * 2.4
    g.fillStyle = `rgba(255,255,255,${0.18 + rnd() * 0.25})`
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  frost = new THREE.CanvasTexture(c)
  frost.colorSpace = THREE.SRGBColorSpace
  return frost
}

// Glass-door beer cooler: four shelves of amber long-necks, two deep, lit by a
// faint cold-white light, behind a frosted, fogged door.
const FRIDGE_SCALE = LAYOUT.beerFridge.scale
const BOTTLE_K = 0.82
// the cabinet is scaled unevenly; undo it so the bottles keep their shape
const BOTTLE_SCALE = [BOTTLE_K / FRIDGE_SCALE[0], BOTTLE_K / FRIDGE_SCALE[1], BOTTLE_K / FRIDGE_SCALE[2]]

export function BeerFridge() {
  const rows = [0.24, 0.54, 0.84, 1.14]
  return (
    <Morph phase="night" delay={0.02} {...LAYOUT.beerFridge}>
      <Model name="beerFridge" fallback={<Box radius={0.04} size={[0.76, 1.85, 0.64]} position={[0, 0.925, 0]} color="#b3201c" />} />
      {/* cool, softly lit back wall and two LED strips down the sides */}
      <Box size={[0.6, 1.3, 0.01]} position={[0, 0.84, -0.2]} color="#cfdbe2" shadows={false} mat={{ emissive: '#d8e6ee', emissiveIntensity: 0.22 }} />
      {[-0.29, 0.29].map((x) => (
        <Box key={x} size={[0.012, 1.2, 0.012]} position={[x, 0.84, 0.24]} color="#ffffff" shadows={false} mat={{ emissive: '#eef7ff', emissiveIntensity: 1.1, toneMapped: false }} />
      ))}
      {rows.map((y) => (
        <group key={y}>
          <Box size={[0.58, 0.01, 0.38]} position={[0, y, 0.02]} color="#cfd6d8" shadows={false} mat={{ metalness: 0.6, roughness: 0.35 }} />
          {Array.from({ length: 5 }, (_, i) => (
            <BeerBottle key={`b${i}`} position={[-0.2 + i * 0.1, y + 0.005, -0.08]} rotation={[0, i * 1.7, 0]} scale={BOTTLE_SCALE} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <BeerBottle key={`f${i}`} position={[-0.25 + i * 0.1, y + 0.005, 0.11]} rotation={[0, i * 2.3, 0]} scale={BOTTLE_SCALE} />
          ))}
        </group>
      ))}
      {/* faint cold-white light inside */}
      <PhaseLight phase="night" position={[0, 1.0, 0.15]} color="#f0f7ff" intensity={0.55} distance={1.3} decay={2} />
      {/* frosted door glass */}
      <mesh position={[0, 0.84, 0.305]} renderOrder={3}>
        <planeGeometry args={[0.62, 1.36]} />
        <meshStandardMaterial map={frostTexture()} color="#ffffff" transparent roughness={0.15} metalness={0.1} depthWrite={false} />
      </mesh>
    </Morph>
  )
}

// Stacked beer crates by the fridge, labelled as in the boteco photo.
function Crate({ color, label, ...props }) {
  return (
    <group {...props}>
      <Box radius={0.02} size={[0.46, 0.32, 0.36]} position={[0, 0.16, 0]} color={color} mat={{ roughness: 0.55 }} />
      <Panel size={[0.32, 0.09]} map={crateLabel(label, color)} position={[0, 0.2, 0.181]} />
      <Box size={[0.12, 0.035, 0.005]} position={[0, 0.27, 0.182]} color="#1a1a1a" shadows={false} />
    </group>
  )
}

export function Crates() {
  return (
    <>
      <Morph phase="night" delay={0.1} {...LAYOUT.crates}>
        {[0, 1, 2].map((i) => (
          <Crate key={i} color="#b8261e" label="BRAHMA" position={[-0.25, i * 0.32, 0]} rotation={[0, (i - 1) * 0.03, 0]} />
        ))}
        <Crate color="#1f4f9c" label="ANTARCTICA" position={[0.25, 0, 0]} />
        <Crate color="#1f4f9c" label="ANTARCTICA" position={[0.25, 0.32, 0]} rotation={[0, 0.04, 0]} />
        <Crate color="#e8b923" label="SKOL" position={[0.25, 0.64, 0.02]} rotation={[0, -0.05, 0]} />
      </Morph>
      {/* yellow crate of empties, the yellow stand and a bottle on the floor */}
      <Morph phase="night" delay={0.12} {...LAYOUT.floorCrate}>
        <Box radius={0.015} size={[0.42, 0.2, 0.3]} position={[0, 0.1, 0]} color="#e8b923" mat={{ roughness: 0.55 }} />
        {[-0.12, 0, 0.12].map((x) => (
          <Bottle key={x} color="#5a2e0e" h={0.24} r={0.028} position={[x, 0.05, 0.03]} />
        ))}
      </Morph>
      <Morph phase="night" delay={0.12} {...LAYOUT.signStand}>
        <Box size={[0.32, 0.5, 0.025]} position={[0, 0.25, 0]} rotation={[-0.18, 0, 0]} color="#e8b923" mat={{ roughness: 0.5 }} />
        <Box size={[0.3, 0.025, 0.2]} position={[0, 0.0125, 0.1]} color="#d4a51c" />
      </Morph>
      <Morph phase="night" delay={0.12} {...LAYOUT.floorBottle}>
        <Bottle color="#2e5a1e" h={0.3} r={0.03} />
      </Morph>
    </>
  )
}
