import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Model } from '../Model'
import { Box, Cyl, PhaseLight } from '../primitives'

// Soft wisp sprite: a blurred blob with ragged density, so overlapping puffs read as vapour.
function wispTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  for (let i = 0; i < 26; i++) {
    const x = 64 + (Math.random() - 0.5) * 50
    const y = 64 + (Math.random() - 0.5) * 50
    const r = 14 + Math.random() * 26
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, 'rgba(255,255,255,0.22)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
  }
  // fade the square's edges so no sprite border ever shows
  const mask = g.createRadialGradient(64, 64, 20, 64, 64, 64)
  mask.addColorStop(0, 'rgba(0,0,0,1)')
  mask.addColorStop(1, 'rgba(0,0,0,0)')
  g.globalCompositeOperation = 'destination-in'
  g.fillStyle = mask
  g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const PUFFS = 16
const LIFE = 3.2 // seconds a puff takes to rise and vanish

// Steam curling up from the espresso cup: puffs rise, widen, drift and twist as they fade.
export function Steam(props) {
  const sprites = useRef([])
  const map = useMemo(wispTexture, [])
  const seeds = useMemo(() => Array.from({ length: PUFFS }, () => ({ phase: Math.random(), drift: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.8 })), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    sprites.current.forEach((s, i) => {
      if (!s) return
      const seed = seeds[i]
      const p = (t / LIFE + seed.phase) % 1
      const rise = p * 0.26
      s.position.set(Math.sin(t * 1.3 + seed.drift + p * 5) * 0.012 * (1 + p * 3), rise, Math.cos(t * 1.1 + seed.drift) * 0.008 * (1 + p * 2))
      s.scale.setScalar(0.025 + p * 0.11)
      s.material.rotation = seed.drift + t * seed.spin
      s.material.opacity = Math.sin(Math.PI * Math.min(1, p * 1.4)) * (1 - p) * 0.8
    })
  })
  return (
    <group {...props} userData={{ noMerge: true }}>
      {seeds.map((_, i) => (
        <sprite key={i} ref={(s) => (sprites.current[i] = s)}>
          <spriteMaterial map={map} transparent depthWrite={false} color="#f4efe6" />
        </sprite>
      ))}
    </group>
  )
}

// Modern espresso machine (Blender) with a fresh cup steaming on the drip tray.
export function Espresso(props) {
  return (
    <group {...props}>
      <Model name="espresso" fallback={<Box radius={0.02} size={[0.27, 0.43, 0.3]} position={[0, 0.215, 0]} color="#8a8a8a" />} />
      {/* a fresh cup on its saucer beside the machine, steaming in the open */}
      <group position={[0.25, 0, 0.1]}>
        <Cyl r={0.06} rTop={0.065} h={0.008} color="#f1ede4" position={[0, 0.004, 0]} mat={{ roughness: 0.25 }} />
        <Cyl r={0.032} rTop={0.04} h={0.06} color="#f1ede4" position={[0, 0.038, 0]} mat={{ roughness: 0.25 }} />
        <Cyl r={0.036} h={0.003} color="#3a1f0e" position={[0, 0.062, 0]} mat={{ roughness: 0.1 }} />
        <mesh position={[0.042, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.014, 0.004, 8, 16]} />
          <meshStandardMaterial color="#f1ede4" roughness={0.25} />
        </mesh>
        <Steam position={[0, 0.07, 0]} />
      </group>
    </group>
  )
}

// Matte black articulated desk lamp (Blender), switched on.
export function DeskLamp(props) {
  return (
    <group {...props}>
      <Model name="deskLamp" />
      <PhaseLight phase="day" position={[0.39, 0.2, 0]} color="#ffcf8a" intensity={0.5} distance={1.4} decay={2} />
    </group>
  )
}
