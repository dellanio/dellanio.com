import React from 'react'
import * as THREE from 'three'
import { Box, Ball, Cyl, Panel, Hotspot } from '../primitives'
import { tabletTexture, woodTexture } from '../textures'

const CAPSULE_COLORS = ['#c0392b', '#2e86c1', '#d4ac0d', '#7d3c98', '#1e8449', '#a04000', '#212f3d', '#b9770e']

// Open wooden box of coffee capsules, lid tipped back.
export function CapsuleBox(props) {
  const w = 0.3
  const d = 0.2
  return (
    <group {...props}>
      <Box size={[w, 0.012, d]} position={[0, 0.006, 0]}>
        <meshStandardMaterial map={woodTexture()} color="#f6d2ad" roughness={0.6} />
      </Box>
      {[
        [[w, 0.07, 0.012], [0, 0.041, d / 2 - 0.006]],
        [[w, 0.07, 0.012], [0, 0.041, -d / 2 + 0.006]],
        [[0.012, 0.07, d], [w / 2 - 0.006, 0.041, 0]],
        [[0.012, 0.07, d], [-w / 2 + 0.006, 0.041, 0]],
      ].map(([size, position], i) => (
        <Box key={i} size={size} position={position}>
          <meshStandardMaterial map={woodTexture()} color="#f6d2ad" roughness={0.6} />
        </Box>
      ))}
      <group position={[0, 0.076, -d / 2]} rotation={[-1.9, 0, 0]}>
        <Box size={[w, 0.012, d]} position={[0, 0, d / 2]}>
          <meshStandardMaterial map={woodTexture()} color="#f6d2ad" roughness={0.6} />
        </Box>
      </group>
      {Array.from({ length: 4 }, (_, j) =>
        Array.from({ length: 6 }, (_, i) => (
          <group key={`${i}-${j}`} position={[-0.11 + i * 0.044, 0.058, -0.066 + j * 0.044]}>
            <Cyl r={0.019} rTop={0.012} h={0.022} seg={16} color={CAPSULE_COLORS[(i * 3 + j * 5) % CAPSULE_COLORS.length]} position={[0, 0.011, 0]} mat={{ metalness: 0.7, roughness: 0.3 }} />
            <Cyl r={0.02} h={0.003} seg={16} color="#c9c9c9" position={[0, 0.001, 0]} mat={{ metalness: 0.8, roughness: 0.3 }} />
          </group>
        )),
      )}
    </group>
  )
}

// Microduck, the little duck robot from the reference: sky-blue printed shells
// on black servo brackets, chunky orange feet, a long articulated neck and a
// boxy head with an orange bill and a yellow camera eye on the side.
const SKY = '#a6dff2'
const BILL = '#f47b20'
const FOOT = '#f6a21a'
const SERVO = '#1d1f22'

// Black servo bracket with two silver screw heads on each side.
function Servo({ size = [0.04, 0.03, 0.04], ...props }) {
  const [w, h] = size
  return (
    <group {...props}>
      <Box radius={0.004} size={size} color={SERVO} mat={{ roughness: 0.5 }} />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sy) => (
          <Cyl key={`${sx}${sy}`} r={0.0025} h={0.002} seg={10} color="#c8ccd0" position={[sx * (w / 2 + 0.001), sy * h * 0.28, 0]} rotation={[0, 0, Math.PI / 2]} mat={{ metalness: 0.9, roughness: 0.25 }} />
        )),
      )}
    </group>
  )
}

export function MiniRobot(props) {
  return (
    <group {...props}>
      {/* legs: orange feet, sky-blue shins, black knee servos */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.042, 0, 0]}>
          <Box radius={0.012} size={[0.052, 0.04, 0.075]} position={[0, 0.02, 0.012]} color={FOOT} mat={{ roughness: 0.45 }} />
          <Servo size={[0.034, 0.024, 0.034]} position={[0, 0.052, 0]} />
          <Box radius={0.01} size={[0.044, 0.05, 0.044]} position={[0, 0.088, 0.002]} color={SKY} mat={{ roughness: 0.4 }} />
          <Servo size={[0.036, 0.026, 0.036]} position={[0, 0.125, -0.004]} />
        </group>
      ))}
      {/* hips */}
      <Box radius={0.012} size={[0.115, 0.045, 0.06]} position={[0, 0.158, -0.006]} color={SKY} mat={{ roughness: 0.4 }} />
      <Servo size={[0.05, 0.03, 0.03]} position={[0, 0.162, -0.04]} />
      {/* articulated neck rising forward */}
      {[0, 1, 2, 3].map((i) => (
        <Servo key={i} size={[0.03, 0.032, 0.026]} position={[0, 0.198 + i * 0.03, -0.022 + i * 0.012]} rotation={[0.18 * i - 0.1, 0, 0]} />
      ))}
      {/* head: rounded box, orange bill underneath and forward, yellow camera eye on the side */}
      <group position={[0, 0.33, 0.03]} rotation={[0.12, -0.35, 0]}>
        <Box radius={0.014} size={[0.068, 0.058, 0.074]} color={SKY} mat={{ roughness: 0.35 }} />
        <Box radius={0.008} size={[0.084, 0.016, 0.1]} position={[0, -0.036, 0.022]} color={BILL} mat={{ roughness: 0.4 }} />
        <Box radius={0.006} size={[0.07, 0.012, 0.03]} position={[0, -0.026, 0.06]} rotation={[0.25, 0, 0]} color={BILL} mat={{ roughness: 0.4 }} />
        <group position={[0.035, 0.008, 0.004]} rotation={[0, 0, Math.PI / 2]}>
          <Cyl r={0.021} h={0.006} seg={28} color="#f7d21e" mat={{ roughness: 0.35 }} />
          <Cyl r={0.011} h={0.008} seg={24} color="#111" position={[0, -0.0015, 0]} mat={{ roughness: 0.1, metalness: 0.3 }} />
          <Cyl r={0.004} h={0.009} seg={12} color="#3a6ea8" position={[0, -0.002, 0]} mat={{ emissive: '#5fa8d3', emissiveIntensity: 0.6 }} />
        </group>
        <group position={[-0.035, 0.008, 0.004]} rotation={[0, 0, Math.PI / 2]}>
          <Cyl r={0.021} h={0.006} seg={28} color="#f7d21e" mat={{ roughness: 0.35 }} />
          <Cyl r={0.011} h={0.008} seg={24} color="#111" position={[0, 0.0015, 0]} mat={{ roughness: 0.1, metalness: 0.3 }} />
        </group>
      </group>
    </group>
  )
}

// Xbox Series gamepad, after the reference photo: a flat body extruded from
// the real top-view outline (shoulders, two long grips, a shallow notch between
// them), offset sticks, hybrid d-pad, ABXY with coloured letters and the guide
// button. Built lying flat, face up, bumpers towards -z. About 16 x 10.5 cm.
const PAD_DEPTH = 0.02
const PAD_BEVEL = 0.009
const PAD_TOP = PAD_DEPTH + PAD_BEVEL

const padGeometry = (() => {
  const half = [
    [0.03, 0.043, 0.055, 0.05, 0.069, 0.039],
    [0.082, 0.029, 0.083, 0.004, 0.079, -0.017],
    [0.075, -0.042, 0.068, -0.063, 0.05, -0.064],
    [0.036, -0.065, 0.03, -0.049, 0.024, -0.036],
    [0.017, -0.027, 0.008, -0.026, 0, -0.026],
  ]
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.041)
  for (const [x1, y1, x2, y2, x, y] of half) shape.bezierCurveTo(x1, y1, x2, y2, x, y)
  for (const [x1, y1, x2, y2, x, y] of [...half].reverse().map((c, i, all) => {
    // walk the right half backwards, mirrored to the left
    const prev = i + 1 < all.length ? all[i + 1] : [0, 0, 0, 0, 0, 0.041]
    return [-c[2], c[3], -c[0], c[1], -prev[4], prev[5]]
  }))
    shape.bezierCurveTo(x1, y1, x2, y2, x, y)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: PAD_DEPTH, bevelEnabled: true, bevelThickness: PAD_BEVEL, bevelSize: 0.008, bevelSegments: 6, curveSegments: 28,
  })
  geo.rotateX(-Math.PI / 2)
  return geo
})()

const letterTextures = {}
function letterTexture(letter, color) {
  if (!letterTextures[letter]) {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    g.fillStyle = '#16171a'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = color
    g.font = 'bold 40px "Segoe UI", Arial, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(letter, 32, 35)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    letterTextures[letter] = tex
  }
  return letterTextures[letter]
}

const FACE_BUTTONS = [
  ['Y', '#f2c94c', 0, -0.0095],
  ['X', '#4aa3ff', -0.0095, 0],
  ['B', '#ff5a4f', 0.0095, 0],
  ['A', '#5fd35f', 0, 0.0095],
]

function Stick({ color, ...props }) {
  return (
    <group {...props}>
      <Cyl r={0.0125} h={0.002} seg={32} color="#0e0e10" position={[0, 0.001, 0]} />
      <Cyl r={0.005} h={0.008} seg={16} color="#202124" position={[0, 0.004, 0]} />
      <Cyl r={0.0105} rTop={0.0112} h={0.004} seg={32} color={color} position={[0, 0.009, 0]} mat={{ roughness: 0.75 }} />
      <mesh position={[0, 0.011, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0094, 0.0016, 10, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Controller({ color, dark = false, ...props }) {
  const trim = dark ? '#2a2b2e' : '#16171a'
  const stick = dark ? '#1f2023' : color
  return (
    <group {...props}>
      <mesh geometry={padGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      {/* bumpers along the shoulders */}
      {[-1, 1].map((s) => (
        <Box key={s} radius={0.004} size={[0.044, 0.011, 0.012]} position={[s * 0.046, PAD_TOP * 0.42, -0.042]} rotation={[0, s * 0.24, 0]} color={dark ? '#141416' : '#2a2b2e'} mat={{ roughness: 0.4 }} />
      ))}
      <group position={[0, PAD_TOP, 0]}>
        <Stick color={stick} position={[-0.037, 0, -0.011]} />
        <Stick color={stick} position={[0.018, 0, 0.012]} />
        {/* hybrid d-pad: a dished disc with the cross on it */}
        <Cyl r={0.0115} h={0.002} seg={32} color="#0e0e10" position={[-0.018, 0.001, 0.012]} />
        <Cyl r={0.0098} h={0.0022} seg={32} color="#3b3c41" position={[-0.018, 0.0025, 0.012]} mat={{ roughness: 0.3, metalness: 0.4 }} />
        <Box radius={0.0012} size={[0.016, 0.0028, 0.0055]} position={[-0.018, 0.0044, 0.012]} color="#0b0b0c" />
        <Box radius={0.0012} size={[0.0055, 0.0028, 0.016]} position={[-0.018, 0.0044, 0.012]} color="#0b0b0c" />
        {/* ABXY */}
        {FACE_BUTTONS.map(([l, c, dx, dz]) => (
          <group key={l} position={[0.037 + dx, 0, -0.011 + dz]}>
            <Cyl r={0.0056} h={0.004} seg={24} color="#16171a" position={[0, 0.002, 0]} mat={{ roughness: 0.3 }} />
            <mesh position={[0, 0.0041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.0055, 24]} />
              <meshStandardMaterial map={letterTexture(l, c)} roughness={0.3} emissive="#ffffff" emissiveMap={letterTexture(l, c)} emissiveIntensity={0.25} />
            </mesh>
          </group>
        ))}
        {/* guide button, view / menu / share */}
        <Cyl r={0.0068} h={0.0025} seg={32} color={dark ? '#2b2c30' : '#f2f2ee'} position={[0, 0.0012, -0.027]} mat={{ emissive: '#ffffff', emissiveIntensity: dark ? 0.08 : 0.25, roughness: 0.3 }} />
        <Cyl r={0.0048} h={0.0026} seg={24} color="#3a3b3f" position={[0, 0.0016, -0.027]} mat={{ roughness: 0.3 }} />
        {[-0.0105, 0.0105].map((x) => (
          <Cyl key={x} r={0.0031} h={0.002} seg={16} color={trim} position={[x, 0.001, -0.01]} />
        ))}
        <Box radius={0.0008} size={[0.0062, 0.002, 0.0036]} position={[0, 0.001, -0.009]} color={trim} />
      </group>
    </group>
  )
}

// Charging dock with an Electric Volt and a black controller standing on it.
export function ControllerDock(props) {
  return (
    <group {...props}>
      <Box radius={0.008} size={[0.38, 0.03, 0.11]} position={[0, 0.015, 0]} color="#151515" mat={{ roughness: 0.4 }} />
      <Box size={[0.34, 0.003, 0.004]} position={[0, 0.02, 0.056]} color="#4cd137" mat={{ emissive: '#4cd137', emissiveIntensity: 1.2 }} />
      {/* standing in the dock, face to the room, grips down */}
      <Controller color="#d3e636" position={[-0.09, 0.094, 0.005]} rotation={[1.2, 0, 0]} />
      <Controller color="#1c1c1e" dark position={[0.09, 0.094, 0.005]} rotation={[1.2, 0, 0]} />
    </group>
  )
}

// Tablet on a stand showing a live dashboard. It is the contact hotspot.
export function Tablet(props) {
  return (
    <group {...props}>
      <Hotspot id="contato" label="Contato" marker={[0, 0.42, 0]}>
        <Box size={[0.12, 0.012, 0.1]} position={[0, 0.006, -0.02]} color="#3a3a3a" mat={{ metalness: 0.7, roughness: 0.3 }} />
        <Box size={[0.02, 0.14, 0.012]} position={[0, 0.07, -0.05]} rotation={[-0.35, 0, 0]} color="#3a3a3a" mat={{ metalness: 0.7, roughness: 0.3 }} />
        <group position={[0, 0.17, -0.02]} rotation={[-0.3, 0, 0]}>
          <Box radius={0.01} size={[0.34, 0.24, 0.012]} color="#111" mat={{ roughness: 0.3 }} />
          <Panel size={[0.32, 0.22]} map={tabletTexture()} lit position={[0, 0, 0.0065]} />
        </group>
      </Hotspot>
    </group>
  )
}

