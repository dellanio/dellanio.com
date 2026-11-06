import React from 'react'
import * as THREE from 'three'
import { Box, Ball, Cyl, Morph } from '../primitives'
import { LAYOUT } from '../layout'
import { Model } from '../Model'

const FABRIC = '#e8dcc3'
const LEG = '#6e4528'

// Woven cotton upholstery (Poly Haven "Cotton Jersey", CC0): the weave detail is
// kept in grey so the chair keeps its cream colour, plus the weave's normal map.
let fabric
function fabricMaps() {
  if (!fabric) {
    const load = (url, srgb) => {
      const t = new THREE.TextureLoader().load(url)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(3, 3)
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    fabric = { map: load('/textures/fabric_detail.jpg', true), normalMap: load('/textures/fabric_normal.jpg'), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.92 }
  }
  return fabric
}

function ArmchairFallback(props) {
  return (
    <group {...props}>
      <Box radius={0.05} size={[0.82, 0.16, 0.78]} position={[0, 0.36, 0]} color={FABRIC} mat={fabricMaps()} />
      <Box radius={0.05} size={[0.7, 0.12, 0.66]} position={[0, 0.49, 0.04]} color="#efe5cf" mat={fabricMaps()} />
      <Box radius={0.06} size={[0.82, 0.6, 0.16]} position={[0, 0.66, -0.33]} rotation={[-0.12, 0, 0]} color={FABRIC} mat={fabricMaps()} />
      {[-0.38, 0.38].map((x) => (
        <Box key={x} radius={0.045} size={[0.1, 0.24, 0.72]} position={[x, 0.54, 0.02]} color={FABRIC} mat={fabricMaps()} />
      ))}
      {[
        [-0.34, -0.3],
        [0.34, -0.3],
        [-0.34, 0.3],
        [0.34, 0.3],
      ].map(([x, z]) => (
        <Cyl key={`${x}${z}`} r={0.02} rTop={0.03} h={0.28} color={LEG} position={[x, 0.14, z]} rotation={[z * 0.3, 0, -x * 0.3]} />
      ))}
      {/* tropical cushion */}
      <Box radius={0.05} size={[0.4, 0.36, 0.12]} position={[0.1, 0.7, -0.18]} rotation={[-0.3, 0.2, 0.1]} color="#3f7d3a" />
      <Box radius={0.04} size={[0.3, 0.26, 0.122]} position={[0.1, 0.7, -0.18]} rotation={[-0.3, 0.2, 0.1]} color="#f2c14e" shadows={false} />
    </group>
  )
}

// Rust bouclé pouf, after the reference: a soft oval "pebble" with rounded
// shoulders and a tufted button in the middle of the top. Lathe-turned
// superellipse squashed to an oval; the bouclé relief is Poly Haven's
// "Wool Boucle" normal map (CC0) plus a shading map made from it, the colour
// our own, with a fabric sheen.
const POUF_R = 0.4
const POUF_H = 0.4
const poufGeometry = (() => {
  const pts = []
  const n = 3.2
  for (let i = 0; i <= 40; i++) {
    const t = -Math.PI / 2 + (i / 40) * Math.PI
    const c = Math.cos(t)
    const sn = Math.sin(t)
    const rr = POUF_R * Math.abs(c) ** (2 / n)
    let yy = POUF_H / 2 + (POUF_H / 2) * Math.sign(sn) * Math.abs(sn) ** (2 / n)
    // the button pulls the middle of the top down a little
    if (sn > 0 && rr < 0.12) yy -= 0.025 * (1 - (rr / 0.12) ** 2) ** 2
    pts.push(new THREE.Vector2(Math.max(rr, i === 0 || i === 40 ? 0 : 0.001), yy))
  }
  return new THREE.LatheGeometry(pts, 72)
})()

let boucle
function boucleMaterial() {
  if (!boucle) {
    const load = (url, srgb) => {
      const t = new THREE.TextureLoader().load(url)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(8, 3)
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    boucle = new THREE.MeshPhysicalMaterial({
      color: '#c8603a', roughness: 0.95, map: load('/textures/boucle_detail.jpg', true),
      normalMap: load('/textures/boucle_normal.jpg'), normalScale: new THREE.Vector2(1.7, 1.7),
      sheen: 0.45, sheenColor: new THREE.Color('#e08a5e'), sheenRoughness: 0.8,
      shadowSide: THREE.BackSide, // closed mesh: back faces in the shadow map, no acne on the curves
    })
  }
  return boucle
}

function Pouf(props) {
  return (
    <group {...props}>
      <mesh geometry={poufGeometry} material={boucleMaterial()} scale={[1, 1, 0.78]} castShadow receiveShadow />
      <mesh position={[0, POUF_H - 0.024, 0]} scale={[1, 0.55, 1]} material={boucleMaterial()} castShadow>
        <sphereGeometry args={[0.018, 16, 10]} />
      </mesh>
    </group>
  )
}

function SideTableFallback(props) {
  return (
    <group {...props}>
      <Cyl r={0.24} h={0.03} color="#8a5a35" position={[0, 0.5, 0]} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return <Cyl key={i} r={0.014} h={0.5} color={LEG} position={[Math.cos(a) * 0.14, 0.25, Math.sin(a) * 0.14]} rotation={[Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15]} />
      })}
    </group>
  )
}

// Oak side table (Poly Haven, 55cm tall) with a mug and a notebook on top.
function SideTable(props) {
  return (
    <group {...props}>
      <Model name="sideTable" fallback={<SideTableFallback />} />
      <Cyl r={0.04} h={0.09} color="#f4f1de" position={[0.08, 0.596, 0.03]} />
      <Box radius={0.004} size={[0.18, 0.02, 0.13]} position={[-0.08, 0.561, -0.04]} rotation={[0, 0.4, 0]} color="#5fa8d3" />
    </group>
  )
}

// The reading corner — "vamos conversar". Plastic tables take its place at night.
export function Lounge() {
  return (
    <Morph phase="day" delay={0.03} {...LAYOUT.lounge}>
      <group>
        {/* the concept has a cream armchair; the Poly Haven one is dark leather */}
        <ArmchairFallback rotation={[0, 0.75, 0]} />
        {/* potted plant on the armchair's left, against the wall */}
        <Model name="plantTall" position={[-0.62, 0, -0.62]} rotation={[0, 0.9, 0]} scale={1.25} />
        <SideTable position={LAYOUT.loungeSideTable} rotation={[0, 0.3, 0]} />
        <Pouf position={LAYOUT.loungeBeanbag} rotation={[0, 0.35, 0]} />
      </group>
    </Morph>
  )
}

// Wall shelf with potted plants above the fridge, as in the office concept.
export function PlantShelf(props) {
  return (
    <group {...props}>
      <Box size={[0.75, 0.03, 0.22]} position={[0, 0, 0.11]} color="#7a4e2c" />
      {[-0.25, 0.25].map((x) => (
        <Box key={x} size={[0.02, 0.14, 0.12]} position={[x, -0.08, 0.06]} color="#2b2b2b" />
      ))}
      {[
        [-0.22, 0.75, 0.4],
        [0.04, 0.9, 2.1],
        [0.26, 0.7, 4.0],
      ].map(([x, s, r]) => (
        <Model key={x} name="pothos" position={[x, 0.015, 0.11]} rotation={[0, r, 0]} scale={s} />
      ))}
    </group>
  )
}

// Black enamel pendant lamp hanging from the ceiling.
export function PendantLamp(props) {
  return (
    <group {...props}>
      <Cyl r={0.005} h={1.1} color="#222" position={[0, 0.55, 0]} />
      <Cyl r={0.2} rTop={0.05} h={0.18} seg={32} color="#2a2d2b" position={[0, -0.09, 0]} mat={{ metalness: 0.4, roughness: 0.35, side: 2 }} />
      <Ball r={0.05} color="#fff3d6" position={[0, -0.15, 0]} mat={{ emissive: '#ffd99a', emissiveIntensity: 1.5 }} />
    </group>
  )
}

// Potted plants stay in both scenes (the boteco has them too).
export function Plant({ scale = 1, leaves = 9, ...props }) {
  return (
    <group scale={scale} {...props}>
      <Cyl r={0.17} rTop={0.21} h={0.36} color="#b9603f" position={[0, 0.18, 0]} />
      <Cyl r={0.19} h={0.02} color="#3a2a1d" position={[0, 0.35, 0]} />
      {Array.from({ length: leaves }, (_, i) => {
        const a = (i / leaves) * Math.PI * 2 + i * 0.3
        const tilt = 0.4 + (i % 3) * 0.2
        return (
          <group key={i} position={[0, 0.36, 0]} rotation={[0, a, 0]}>
            <group rotation={[tilt, 0, 0]}>
              <Cyl r={0.008} h={0.4 + (i % 4) * 0.12} color="#4a7a3a" position={[0, 0.2, 0]} />
              <mesh position={[0, 0.42 + (i % 4) * 0.12, 0]} rotation={[0.3, 0, 0]} scale={[1, 0.25, 1.6]} castShadow>
                <sphereGeometry args={[0.13, 10, 8]} />
                <meshStandardMaterial color={i % 2 ? '#3f7d3a' : '#4f9a48'} roughness={0.6} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}

export function HangingPlant(props) {
  // terracotta pot of trailing pothos (Blender) on three cords from the ceiling
  return (
    <group {...props}>
      {[0, 2.09, 4.19].map((a) => (
        <Cyl key={a} r={0.003} h={0.62} color="#8a7a66" position={[Math.cos(a) * 0.045, 0.31, Math.sin(a) * 0.045]} rotation={[Math.sin(a) * 0.13, 0, -Math.cos(a) * 0.13]} />
      ))}
      <Model name="pothos" position={[0, -0.12, 0]} />
    </group>
  )
}
