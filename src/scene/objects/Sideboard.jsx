import React from 'react'
import { Model } from '../Model'
import { Box, Cyl, Morph } from '../primitives'
import { LAYOUT } from '../layout'
import { Espresso } from './CoffeeCorner'
import { CapsuleBox, MiniRobot, ControllerDock, Tablet } from './Gadgets'

const WOOD = '#8a5a35'
const WOOD_DARK = '#6e4528'

// Mid-century sideboard with slatted doors; becomes the bar counter at night.
function Body() {
  return (
    <group>
      <Box radius={0.02} size={[3.0, 0.6, 0.5]} position={[0, 0.42, 0]} color={WOOD} />
      <Box radius={0.015} size={[3.04, 0.04, 0.54]} position={[0, 0.74, 0]} color={WOOD_DARK} />
      {[-1.12, -0.37, 0.37, 1.12].map((x) => (
        <group key={x} position={[x, 0.42, 0.252]}>
          {Array.from({ length: 9 }, (_, i) => (
            <Box key={i} size={[0.05, 0.5, 0.012]} position={[-0.3 + i * 0.075, 0, 0]} color={WOOD_DARK} />
          ))}
        </group>
      ))}
      {[-1.4, 1.4].map((x) =>
        [-0.18, 0.18].map((z) => (
          <Cyl key={`${x}${z}`} r={0.025} rTop={0.035} h={0.12} color={WOOD_DARK} position={[x, 0.06, z]} />
        )),
      )}
    </group>
  )
}

// Model of the Recife bridges: deck on three arches.
export function BridgeModel(props) {
  return (
    <group {...props}>
      <Box size={[0.95, 0.03, 0.26]} position={[0, 0.015, 0]} color="#efe6d2" />
      <Box size={[0.9, 0.02, 0.1]} position={[0, 0.2, 0]} color="#e3c48a" />
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.03, 0]} castShadow>
          <torusGeometry args={[0.15, 0.012, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#e3c48a" />
        </mesh>
      ))}
      {[-0.42, -0.15, 0.15, 0.42].map((x) => (
        <Box key={x} size={[0.02, 0.17, 0.02]} position={[x, 0.115, 0]} color="#e3c48a" />
      ))}
    </group>
  )
}

export function Camera(props) {
  return (
    <group {...props}>
      <Box radius={0.015} size={[0.22, 0.13, 0.08]} position={[0, 0.065, 0]} color="#1e1e1e" />
      <Box size={[0.22, 0.04, 0.081]} position={[0, 0.1, 0]} color="#c8c8c8" mat={{ metalness: 0.6, roughness: 0.3 }} />
      <Cyl r={0.04} h={0.06} color="#111" position={[0, 0.06, 0.065]} rotation={[Math.PI / 2, 0, 0]} />
      <Cyl r={0.028} h={0.005} color="#5a7aa0" position={[0, 0.06, 0.096]} rotation={[Math.PI / 2, 0, 0]} mat={{ metalness: 0.9, roughness: 0.1 }} />
    </group>
  )
}

// Phone + tablet mockups on stands.
export function Sideboard() {
  return (
    <Morph phase="day" delay={0.04} position={LAYOUT.sideboard.position} rotation={LAYOUT.sideboard.rotation}>
      <Model name="sideboard" scale={LAYOUT.sideboard.modelScale} fallback={<Body />} />
      <group position={[0, 0.76, 0]}>
        <BridgeModel position={[-1.85, 0, 0]} />
        <Espresso position={[-1.12, 0, 0.02]} />
        <CapsuleBox position={[-0.62, 0, 0.0]} rotation={[0, 0.08, 0]} />
        <MiniRobot position={[-0.1, 0, 0.02]} rotation={[0, 0.25, 0]} />
        <ControllerDock position={[0.45, 0, -0.01]} />
        <Tablet position={[1.12, 0, 0.02]} rotation={[0, -0.15, 0]} />
        <Camera position={[1.62, 0, 0.02]} rotation={[0, -0.4, 0]} />
        <Cyl r={0.05} rTop={0.06} h={0.14} color="#f4f1de" position={[1.95, 0.07, -0.05]} />
      </group>
    </Morph>
  )
}
