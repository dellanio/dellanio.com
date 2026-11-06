import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Box, Merge, Morph } from './primitives'
import { floorTexture, plasterTexture, paintTexture, wallTileTexture, botecoTileTexture, woodTexture } from './textures'
import { timeState } from './state'

// Room is 9m x 9m, origin at floor center. As in both reference pictures, the
// camera looks into the corner between the back wall (z = -4.5) and the right
// wall (x = +4.5); the left side stays open.
// The back wall and floor run on past the left edge of the frame, as in the photos.
export const ROOM = { half: 4.5, front: 9, left: -7.5, right: 4.95, height: 3.3, tileHeight: 1.4 }
// The window only exists by day; at night a patch of wall closes it (the boteco has none).
export const WINDOW = { x0: 0.35, x1: 3.07, y0: 0.75, y1: 2.47 }

const T = 0.2 // wall thickness
const TRIM = '#2f6f6a'

// One material for every plastered wall (so the merged walls share it): smooth
// paint by day, the worn boteco plaster by night, swapped mid-transition while
// the furniture is morphing.
// Kept on globalThis: a hot reload re-runs this module, but the walls <Merge>
// baked at mount still use the first materials, so those must stay the ones
// WallFinish updates (otherwise the office keeps the boteco plaster).
const WALLS = (globalThis.__roomWalls ??= { plaster: new THREE.MeshStandardMaterial({ roughness: 0.95 }), tiles: [] })
const plasterMaterial = WALLS.plaster

function WallFinish() {
  // checked every frame and per material, so a hot reload or a remount can
  // never leave the office with the boteco's plaster (or the reverse)
  useFrame(() => {
    const day = timeState.t < 0.5
    const map = day ? paintTexture() : plasterTexture()
    if (plasterMaterial.map !== map) {
      plasterMaterial.map = map
      plasterMaterial.roughness = day ? 0.8 : 0.95
      plasterMaterial.needsUpdate = true
    }
    for (const m of tileMaterials) {
      const tiles = day ? m.userData.day : m.userData.night
      if (m.map !== tiles) {
        m.map = tiles
        m.roughness = day ? 0.35 : 0.5
        m.needsUpdate = true
      }
    }
  })
  return null
}

function Plaster({ size, ...props }) {
  return (
    <mesh castShadow receiveShadow material={plasterMaterial} {...props}>
      <boxGeometry args={size} />
    </mesh>
  )
}

// Tile strips swap with the wall finish: clean white tiles by day, the aged
// star tiles of the boteco by night.
const tileMaterials = WALLS.tiles

// All strips share one material. `origin` is where the strip's bottom-left
// corner sits on its wall, in metres (along the wall, up from the floor): the
// UVs are laid out from it, so neighbouring strips continue the same tile grid.
const tileMaterial = (() => {
  const m = new THREE.MeshStandardMaterial({ map: wallTileTexture(), roughness: 0.35 })
  m.userData.day = m.map
  m.userData.night = botecoTileTexture()
  tileMaterials.push(m)
  return m
})()

function TileStrip({ width, height, origin = [0, 0], ...props }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height)
    const uv = geo.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, origin[0] + uv.getX(i) * width, origin[1] + uv.getY(i) * height)
    return geo
  }, [width, height, origin[0], origin[1]])
  return <mesh receiveShadow material={tileMaterial} geometry={geometry} {...props} />
}

// Thin strips along a wall; local x runs along the wall, +z points into the room.
function Trim({ length, y, ...props }) {
  return (
    <group {...props}>
      <Box size={[length, 0.05, 0.03]} position={[0, y, 0.015]} color={TRIM} shadows={false} mat={{ roughness: 0.3 }} />
    </group>
  )
}

function Baseboard({ length, ...props }) {
  return (
    <group {...props}>
      <Box size={[length, 0.09, 0.025]} position={[0, 0.045, 0.0125]} color="#2b4a47" shadows={false} mat={{ roughness: 0.4 }} />
    </group>
  )
}

function Cap({ length, ...props }) {
  return (
    <group {...props}>
      <Box size={[length, 0.03, T + 0.01]} position={[0, 0.015, 0]} color="#2a1f17" shadows={false} />
    </group>
  )
}

function BackWall() {
  const { half, left, right, height, tileHeight } = ROOM
  const { x0, x1, y0, y1 } = WINDOW
  const z = -half - T / 2
  const face = -half + 0.005
  const leftW = x0 - left
  const rightW = right - x1
  const winW = x1 - x0
  return (
    <group>
      <Plaster size={[leftW, height, T]} position={[left + leftW / 2, height / 2, z]} />
      <Plaster size={[rightW, height, T]} position={[x1 + rightW / 2, height / 2, z]} />
      <Plaster size={[winW, y0, T]} position={[(x0 + x1) / 2, y0 / 2, z]} />
      <Plaster size={[winW, height - y1, T]} position={[(x0 + x1) / 2, (height + y1) / 2, z]} />

      {/* along-wall coordinate measured from the right-hand corner, where it meets the right wall's grid */}
      <TileStrip width={leftW} height={tileHeight} origin={[left - right, 0]} position={[left + leftW / 2, tileHeight / 2, face]} />
      <TileStrip width={rightW} height={tileHeight} origin={[x1 - right, 0]} position={[x1 + rightW / 2, tileHeight / 2, face]} />
      <TileStrip width={winW} height={y0} origin={[x0 - right, 0]} position={[(x0 + x1) / 2, y0 / 2, face]} />

      <Trim length={leftW} y={tileHeight} position={[left + leftW / 2, 0, -half]} />
      <Trim length={rightW} y={tileHeight} position={[x1 + rightW / 2, 0, -half]} />
      <Baseboard length={right - left} position={[(right + left) / 2, 0, -half]} />
      <Cap length={right - left + T} position={[(right + left) / 2 + T / 2, height, z]} />
    </group>
  )
}

function RightWall() {
  const { half, right, height, tileHeight } = ROOM
  return (
    <group>
      <Plaster size={[T, height, half * 2 + T]} position={[right + T / 2, height / 2, -T / 2]} />
      <TileStrip width={half * 2} height={tileHeight} rotation={[0, -Math.PI / 2, 0]} position={[right - 0.005, tileHeight / 2, 0]} />
      <group rotation={[0, -Math.PI / 2, 0]}>
        <Trim length={half * 2} y={tileHeight} position={[0, 0, -right]} />
        <Baseboard length={half * 2} position={[0, 0, -right]} />
        <Cap length={half * 2 + T} position={[-T / 2, height, -right - T / 2]} />
      </group>
    </group>
  )
}

// Far left wall, out of the home framing; closes the room in close-ups.
function LeftWall() {
  const { half, left, height, tileHeight } = ROOM
  return (
    <group>
      <Plaster size={[T, height, half * 2]} position={[left - T / 2, height / 2, 0]} />
      <TileStrip width={half * 2} height={tileHeight} rotation={[0, Math.PI / 2, 0]} position={[left + 0.005, tileHeight / 2, 0]} />
      <group rotation={[0, Math.PI / 2, 0]}>
        <Trim length={half * 2} y={tileHeight} position={[0, 0, left]} />
        <Baseboard length={half * 2} position={[0, 0, left]} />
      </group>
    </group>
  )
}

function Floor() {
  // runs out past the front so the day camera, further back, never sees its edge
  const { half, front, left, right } = ROOM
  const depth = front + half
  const map = floorTexture().clone()
  // ~0.43 m tiles: six of them along the pool table, as in the photo
  map.repeat.set(((right - left) / (half * 2)) * 10.5, (depth / (half * 2)) * 10.5)
  map.needsUpdate = true
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(right + left) / 2, 0, (front - half) / 2]} receiveShadow>
      <planeGeometry args={[right - left, depth]} />
      <meshStandardMaterial map={map} roughness={0.55} />
    </mesh>
  )
}

// Plain warm ceiling: the photos show its edge across the top of the frame.
function Ceiling() {
  const { half, left, right, height } = ROOM
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[(right + left) / 2, height, 0]}>
      <planeGeometry args={[right - left, half * 2]} />
      <meshStandardMaterial color="#cbb894" roughness={0.95} />
    </mesh>
  )
}

// The view of Recife Antigo, split from the one photo into three layers: a
// clean sky, a wide wrapping strip of the photo's own clouds that drifts
// across it (sometimes cumulus, sometimes clear blue), and the houses and
// palms with the sky cut out, in front. They start loading as soon as the
// module does, so the window never shows an empty frame.
const VIEW = { w: 5.6, h: 3.15, z: -ROOM.half - 1.6 }
const CLOUD_SPEED = 0.006 // strip widths per second: a cloud takes about a minute and a half to cross
let viewLayers
function recifeLayers() {
  if (!viewLayers) {
    const load = (url) => {
      const t = new THREE.TextureLoader().load(url)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    const clouds = load('/textures/recife_clouds.png')
    clouds.wrapS = THREE.RepeatWrapping
    clouds.repeat.set(0.5, 1) // the strip is two view widths long
    viewLayers = { sky: load('/textures/recife_sky.jpg'), clouds, houses: load('/textures/recife_buildings.webp') }
  }
  return viewLayers
}
recifeLayers()

// Day: window frame, open green shutters and the view of Recife Antigo.
function Window() {
  const { x0, x1, y0, y1 } = WINDOW
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const w = x1 - x0
  const h = y1 - y0
  const z = -ROOM.half
  const layers = useRef([])
  // the view never morphs away (the opening would show the void mid-transition); it just dims
  const dayTint = useRef(new THREE.Color('#ffffff'))
  const nightTint = useRef(new THREE.Color('#1b2140'))
  const { sky, clouds, houses } = recifeLayers()
  useFrame((_, delta) => {
    for (const m of layers.current) m?.color.lerpColors(dayTint.current, nightTint.current, timeState.t)
    clouds.offset.x = (clouds.offset.x + delta * CLOUD_SPEED) % 1 // drifting right to left
  })
  return (
    <>
    {/* far enough behind for parallax; top stays under the sightline over the wall.
        Back to front: sky, drifting clouds, houses and palms. */}
    {[sky, clouds, houses].map((map, i) => (
      <mesh key={i} position={[cx, 1.75, VIEW.z + i * 0.01]} renderOrder={i}>
        <planeGeometry args={[VIEW.w, VIEW.h]} />
        <meshBasicMaterial ref={(m) => (layers.current[i] = m)} map={map} transparent={i > 0} depthWrite={i === 0} toneMapped={false} />
      </mesh>
    ))}
    <Morph phase="day" delay={0.02}>
      <WoodFrame x0={x0} x1={x1} y0={y0} y1={y1} z={z} />
      {[
        [x0 - 0.06, -1],
        [x1 + 0.06, 1],
      ].map(([sx, side]) => (
        // hinged on the frame, swung open against the wall
        <group key={side} position={[sx, cy, z + 0.03]} rotation={[0, side * -1.35, 0]}>
          <Shutter w={0.74} h={h} position={[side * 0.37, 0, 0]} />
        </group>
      ))}
    </Morph>
    </>
  )
}

// Varnished wood finish shared by the frame and shutters.
function Wood({ size, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial map={woodTexture()} color="#f0c49a" roughness={0.45} />
    </mesh>
  )
}

// Casement frame and sashes: sill, jambs, head, a centre post and glazing bars.
function WoodFrame({ x0, x1, y0, y1, z }) {
  const w = x1 - x0
  const h = y1 - y0
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return (
    <group>
      <Wood size={[w + 0.2, 0.06, 0.32]} position={[cx, y0 - 0.03, z + 0.06]} />
      <Wood size={[w + 0.16, 0.09, 0.22]} position={[cx, y1 + 0.045, z]} />
      <Wood size={[0.08, h, 0.22]} position={[x0 - 0.04, cy, z]} />
      <Wood size={[0.08, h, 0.22]} position={[x1 + 0.04, cy, z]} />
      <Wood size={[0.06, h, 0.08]} position={[cx, cy, z - 0.04]} />
      {/* sash rails and a glazing bar across each pane */}
      {[x0 + w / 4, x1 - w / 4].map((px) => (
        <group key={px}>
          <Wood size={[w / 2 - 0.06, 0.05, 0.05]} position={[px, y0 + 0.03, z - 0.05]} />
          <Wood size={[w / 2 - 0.06, 0.05, 0.05]} position={[px, y1 - 0.03, z - 0.05]} />
          <Wood size={[w / 2 - 0.06, 0.025, 0.035]} position={[px, cy + h * 0.12, z - 0.05]} />
        </group>
      ))}
    </group>
  )
}

// One leaf of the colonial shutter: angled louvres above, a raised panel below.
function Shutter({ w, h, ...props }) {
  const stile = 0.065
  const top = 0.08
  const bottom = 0.1
  const mid = 0.07
  const midY = -h / 2 + h * 0.36 // middle rail height
  const louvreTop = h / 2 - top
  const louvreBottom = midY + mid / 2
  const count = Math.round((louvreTop - louvreBottom) / 0.045)
  const step = (louvreTop - louvreBottom) / count
  const panelH = midY - mid / 2 - (-h / 2 + bottom)
  return (
    <group {...props}>
      <Wood size={[stile, h, 0.04]} position={[-w / 2 + stile / 2, 0, 0]} />
      <Wood size={[stile, h, 0.04]} position={[w / 2 - stile / 2, 0, 0]} />
      <Wood size={[w, top, 0.04]} position={[0, h / 2 - top / 2, 0]} />
      <Wood size={[w, mid, 0.04]} position={[0, midY, 0]} />
      <Wood size={[w, bottom, 0.04]} position={[0, -h / 2 + bottom / 2, 0]} />
      {Array.from({ length: count }, (_, i) => (
        <Wood key={i} size={[w - stile * 2, 0.008, 0.05]} position={[0, louvreBottom + step * (i + 0.5), 0]} rotation={[-0.75, 0, 0]} />
      ))}
      {/* recessed field with a raised centre panel */}
      <Wood size={[w - stile * 2, panelH, 0.016]} position={[0, -h / 2 + bottom + panelH / 2, -0.006]} />
      <Wood size={[w - stile * 2 - 0.1, panelH - 0.1, 0.03]} position={[0, -h / 2 + bottom + panelH / 2, 0.002]} />
    </group>
  )
}

// Night: plain wall where the window was, matching the boteco photo.
function WindowPatch() {
  const { x0, x1, y0, y1 } = WINDOW
  const { tileHeight } = ROOM
  const cx = (x0 + x1) / 2
  const w = x1 - x0
  return (
    <Morph phase="night" delay={0.02} position={[cx, y0, -ROOM.half - T / 2]}>
      <Plaster size={[w + 0.02, y1 - y0, T - 0.01]} position={[0, (y1 - y0) / 2, 0]} />
      <TileStrip width={w} height={tileHeight - y0} origin={[x0 - ROOM.right, y0]} position={[0, (tileHeight - y0) / 2, T / 2 + 0.006]} />
      <Trim length={w} y={tileHeight - y0} position={[0, 0, T / 2]} />
    </Morph>
  )
}

export function Room() {
  return (
    <Merge>
      <WallFinish />
      <Floor />
      <Ceiling />
      <BackWall />
      <RightWall />
      <LeftWall />
      <Window />
      <WindowPatch />
    </Merge>
  )
}
