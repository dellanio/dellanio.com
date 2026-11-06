import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { timeState, smooth } from './state'
import { useLang } from '../i18n'
import { HOTSPOT_LABELS } from '../content'

// radius > 0 gives softly rounded edges (furniture); plain boxes stay cheap.
export function Box({ size = [1, 1, 1], color = '#ffffff', mat, shadows = true, radius = 0, children, ...props }) {
  const material = children ?? <meshStandardMaterial color={color} roughness={0.8} {...mat} />
  if (radius > 0)
    return (
      <RoundedBox args={size} radius={Math.min(radius, ...size.map((v) => v / 2 - 0.0001))} smoothness={3} castShadow={shadows} receiveShadow {...props}>
        {material}
      </RoundedBox>
    )
  return (
    <mesh castShadow={shadows} receiveShadow {...props}>
      <boxGeometry args={size} />
      {material}
    </mesh>
  )
}

export function Cyl({ r = 0.1, rTop, h = 1, seg = 24, color = '#ffffff', mat, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={[rTop ?? r, r, h, seg]} />
      <meshStandardMaterial color={color} roughness={0.7} {...mat} />
    </mesh>
  )
}

export function Ball({ r = 0.1, color = '#ffffff', mat, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <sphereGeometry args={[r, 24, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} {...mat} />
    </mesh>
  )
}

// Flat textured panel (screens, posters, signs). Unlit so it reads like a display.
export function Panel({ size, map, lit = false, ...props }) {
  return (
    <mesh {...props}>
      <planeGeometry args={size} />
      {lit ? (
        <meshBasicMaterial map={map} toneMapped={false} />
      ) : (
        <meshStandardMaterial map={map} roughness={0.9} />
      )}
    </mesh>
  )
}

// A point light belonging to a day- or night-only object. It lives at the scene
// root and is never hidden: three.js compiles each shader for the number of
// visible lights, so a light vanishing with its object would make every
// material recompile at the day/night switch (a multi-second freeze). It
// follows an anchor placed where the light sits and fades with its phase.
export function PhaseLight({ phase, position = [0, 0, 0], intensity = 1, ...props }) {
  const anchor = useRef()
  const light = useRef()
  const { scene } = useThree()
  const world = useRef(new THREE.Vector3())
  useFrame(() => {
    anchor.current.getWorldPosition(world.current)
    light.current.position.copy(world.current)
    const t = timeState.t
    const k = phase === 'day' ? 1 - Math.min(1, t * 2) : Math.max(0, t * 2 - 1)
    light.current.intensity = intensity * k
  })
  return (
    <>
      <object3D ref={anchor} position={position} />
      {createPortal(<pointLight ref={light} intensity={0} {...props} />, scene)}
    </>
  )
}

// Grows/shrinks its children with the day/night transition.
// Day objects leave during the first half, night objects arrive in the second.
export function Morph({ phase, delay = 0, scale = 1, children, ...props }) {
  const ref = useRef()
  const base = Array.isArray(scale) ? scale : [scale, scale, scale]
  useFrame(() => {
    const p = timeState.t
    const s = Math.max(phase === 'day' ? 1 - smooth((p - delay) / 0.35) : smooth((p - 0.5 - delay) / 0.35), 0.0001)
    ref.current.scale.set(base[0] * s, base[1] * s, base[2] * s)
    ref.current.visible = s > 0.002
  })
  return (
    // noMerge: an enclosing <Merge> must not bake this group, it scales on its own
    <group ref={ref} userData={{ noMerge: true }} {...props}>
      <Merge>{children}</Merge>
    </group>
  )
}

function materialKey(m) {
  return [
    m.type,
    m.color?.getHexString(),
    m.emissive?.getHexString(),
    m.emissiveIntensity,
    m.roughness,
    m.metalness,
    m.map?.uuid,
    m.alphaMap?.uuid,
    m.transparent,
    m.opacity,
    m.toneMapped,
    m.side,
    m.depthWrite,
    m.flatShading,
    m.blending,
  ].join('|')
}

const ATTRS = ['position', 'normal', 'uv']

function normalized(geometry, matrix) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone()
  for (const name of Object.keys(g.attributes)) if (!ATTRS.includes(name)) g.deleteAttribute(name)
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  if (!g.attributes.normal) g.computeVertexNormals()
  g.morphAttributes = {}
  g.clearGroups()
  return g.applyMatrix4(matrix)
}

// Draw-call reducer: after mount, meshes under this group that share a material
// are baked into one mesh per material. The originals stay (hidden) so R3F's
// pointer events keep working on them. Anything animated must sit under an
// object with userData.noMerge.
export function Merge({ children }) {
  const root = useRef()
  useLayoutEffect(() => {
    const g = root.current
    g.updateWorldMatrix(true, true)
    const toLocal = g.matrixWorld.clone().invert()
    const skip = new Set()
    g.traverse((o) => o.userData.noMerge && o.traverse((c) => skip.add(c)))
    const buckets = new Map()
    g.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || skip.has(o) || Array.isArray(o.material) || !o.visible) return
      const key = `${materialKey(o.material)}|${o.castShadow}|${o.receiveShadow}`
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(o)
    })
    const merged = []
    const hidden = []
    for (const meshes of buckets.values()) {
      if (meshes.length < 2) continue
      const geometry = mergeGeometries(meshes.map((m) => normalized(m.geometry, toLocal.clone().multiply(m.matrixWorld))))
      if (!geometry) continue
      const mesh = new THREE.Mesh(geometry, meshes[0].material)
      mesh.castShadow = meshes[0].castShadow
      mesh.receiveShadow = meshes[0].receiveShadow
      mesh.raycast = () => {} // picking stays on the hidden originals
      g.add(mesh)
      merged.push(mesh)
      for (const m of meshes) {
        m.visible = false
        hidden.push(m)
      }
    }
    return () => {
      for (const m of merged) {
        g.remove(m)
        m.geometry.dispose()
      }
      for (const m of hidden) m.visible = true
    }
  }, [])
  return <group ref={root}>{children}</group>
}

export const SelectContext = createContext({ select: () => {} })

// true on phones / weak GPUs: fewer particles, smaller shadow maps, no AO.
export const QualityContext = createContext(false)

// Diamond marker shaded from deep navy (bottom) to sky blue (top).
let diamondGeometry
function diamond() {
  if (!diamondGeometry) {
    const g = new THREE.OctahedronGeometry(0.07)
    const pos = g.attributes.position
    const colors = []
    const low = new THREE.Color('#1e3a8a')
    const mid = new THREE.Color('#2563eb')
    const high = new THREE.Color('#38bdf8')
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) / 0.07 + 1) / 2
      if (t < 0.5) c.lerpColors(low, mid, t * 2)
      else c.lerpColors(mid, high, (t - 0.5) * 2)
      colors.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    diamondGeometry = g
  }
  return diamondGeometry
}

// Clickable object with a floating blue diamond and a hover label.
export function Hotspot({ id, label, marker = [0, 1, 0], children }) {
  const { select } = useContext(SelectContext)
  const lang = useLang()
  const [hover, setHover] = useState(false)
  const diamondRef = useRef()
  useFrame((state) => {
    const d = diamondRef.current
    if (!d) return
    d.rotation.y += 0.02
    d.position.y = marker[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
    const target = hover ? 1.5 : 1
    d.scale.setScalar(d.scale.x + (target - d.scale.x) * 0.15)
  })
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        select(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'var(--cursor-hover)'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
    >
      {children}
      {marker && (
        <mesh ref={diamondRef} position={marker} geometry={diamond()} userData={{ noMerge: true }}>
          <meshBasicMaterial vertexColors toneMapped={false} />
        </mesh>
      )}
      {hover && marker && (
        <Html position={[marker[0], marker[1] + 0.2, marker[2]]} center style={{ pointerEvents: 'none' }}>
          <div className="hotspot-label">{HOTSPOT_LABELS[lang][id] ?? label}</div>
        </Html>
      )}
    </group>
  )
}
