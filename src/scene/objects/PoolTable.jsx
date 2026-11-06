import React from 'react'
import { Box, Ball, Cyl, Morph, Hotspot } from '../primitives'
import { LAYOUT } from '../layout'
import { Model } from '../Model'
import { baizeTexture } from '../textures'
import * as THREE from 'three'
import { Pool3D } from '../../game/Pool3D'
import { usePool } from '../../game/store'

const WOOD = '#4a2a1a'
const RAIL = '#5e3521'
const FELT = '#2f8f4e'
function Table() {
  return (
    <group>
      <Box radius={0.04} size={[2.6, 0.2, 1.46]} position={[0, 0.7, 0]} color={WOOD} mat={{ roughness: 0.5 }} />
      <Box size={[2.36, 0.03, 1.22]} position={[0, 0.815, 0]} color={FELT} mat={{ roughness: 1 }} />
      {/* cushions */}
      <Box radius={0.025} size={[2.6, 0.07, 0.12]} position={[0, 0.84, 0.67]} color={RAIL} />
      <Box radius={0.025} size={[2.6, 0.07, 0.12]} position={[0, 0.84, -0.67]} color={RAIL} />
      <Box radius={0.025} size={[0.12, 0.07, 1.46]} position={[1.24, 0.84, 0]} color={RAIL} />
      <Box radius={0.025} size={[0.12, 0.07, 1.46]} position={[-1.24, 0.84, 0]} color={RAIL} />
      {/* pockets */}
      {[-1.2, 0, 1.2].flatMap((x) =>
        [-0.63, 0.63].map((z) => (
          <Cyl key={`${x}${z}`} r={0.055} h={0.08} color="#111" position={[x, 0.845, z]} />
        )),
      )}
      {/* turned legs */}
      {[-1.05, 1.05].flatMap((x) =>
        [-0.52, 0.52].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <Cyl r={0.09} rTop={0.06} h={0.5} color={WOOD} position={[0, 0.35, 0]} />
            <Cyl r={0.11} h={0.1} color={WOOD} position={[0, 0.05, 0]} />
          </group>
        )),
      )}
    </group>
  )
}

// Even green baize (the model's own cloth is flat and catches shadow acne).
// flatShading: the pocket cut-outs left long triangles whose blended normals drew light wedges
const CLOTH = { felt: { map: baizeTexture(), color: new THREE.Color('#22693a'), roughness: 1, metalness: 0, flatShading: true } }

// The brass pocket rims in the model are full rings that run out over the
// cloth and cushions. Keep only what lies on the wooden rail, so the brass
// just edges each pocket: drop every triangle whose centre is over the felt.
const FELT_X = 1.192 // the felt (cloth + cushions) ends here in the model
const FELT_Z = 0.622
function trimPocketRims(mesh) {
  const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
  const pos = geo.attributes.position
  const keep = []
  for (let t = 0; t < pos.count; t += 3) {
    const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3
    const cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3
    if (Math.abs(cx) > FELT_X || Math.abs(cz) > FELT_Z) keep.push(t)
  }
  const out = new THREE.BufferGeometry()
  for (const [name, attr] of Object.entries(geo.attributes)) {
    const size = attr.itemSize
    const data = new attr.array.constructor(keep.length * 3 * size)
    keep.forEach((t, j) => data.set(attr.array.subarray(t * size, (t + 3) * size), j * 3 * size))
    out.setAttribute(name, new THREE.BufferAttribute(data, size, attr.normalized))
  }
  mesh.geometry = out
}
const TABLE_MESHES = { brass: trimPocketRims }

export function PoolTable() {
  const { playing } = usePool()
  return (
    <Morph phase="night" {...LAYOUT.pool}>
      <Hotspot id="sinuca" label="Jogar sinuca 🎱" marker={playing ? null : [0, 1.3, 0]}>
        <Model name="poolTable" materials={CLOTH} meshes={TABLE_MESHES} fallback={<Table />} />
      </Hotspot>
      {/* the match is played right here on the table */}
      <Pool3D />
    </Morph>
  )
}

// Long billiard lamp hanging from the ceiling line.
export function PoolLamp() {
  return (
    <Morph phase="night" delay={0.06} {...LAYOUT.poolLamp}>
      <Box radius={0.04} size={[1.7, 0.14, 0.38]} color="#151515" mat={{ roughness: 0.4, metalness: 0.3 }} />
      {[-0.55, 0, 0.55].map((x) => (
        <mesh key={x} position={[x, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.45, 0.26]} />
          <meshBasicMaterial color={[1.9, 1.75, 1.45]} toneMapped={false} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((x) => (
        <Cyl key={x} r={0.006} h={1.2} color="#111" position={[x, 0.66, 0]} />
      ))}
    </Morph>
  )
}
