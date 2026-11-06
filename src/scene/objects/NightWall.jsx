import * as THREE from 'three'
import React from 'react'
import { Box, Cyl, Panel, Morph, Hotspot, PhaseLight } from '../primitives'
import { LAYOUT } from '../layout'
import { signTexture, soccerTexture, posterTexture } from '../textures'
import { Model } from '../Model'
import { TvVideo } from './TvVideo'


// Wide TV hanging from the ceiling on two rods, turned towards the room (as in the photo).
export function Tv({ on, focused }) {
  return (
    <Morph phase="night" delay={0.06} {...LAYOUT.tv}>
      <Hotspot id="tv" label="Demos & vídeos" marker={[0, 0.5, 0.2]}>
        <Box radius={0.03} size={[0.92, 0.6, 0.22]} color="#141414" mat={{ roughness: 0.45 }} />
        <Panel size={[0.82, 0.5]} map={soccerTexture()} lit position={[0, 0.01, 0.112]} />
        {on && <TvVideo size={[0.82, 0.5]} position={[0, 0.01, 0.114]} focused={focused} />}
        <Box size={[0.5, 0.03, 0.12]} position={[0, 0.315, -0.02]} color="#1c1c1c" />
        <Box size={[0.03, 0.55, 0.03]} position={[-0.22, 0.6, -0.02]} color="#1c1c1c" />
        <Box size={[0.03, 0.55, 0.03]} position={[0.22, 0.6, -0.02]} color="#1c1c1c" />
        <PhaseLight phase="night" position={[0, 0, 0.7]} color="#7fe08a" intensity={1.2} distance={2.5} />
      </Hotspot>
    </Morph>
  )
}

// Calendar poster with a photo, where the window is by day.
export function NightPoster() {
  return (
    <Morph phase="night" delay={0.05} {...LAYOUT.poster}>
      <Panel size={[0.5, 0.66]} map={posterTexture()} />
    </Morph>
  )
}

// Cue rack: same spot as the day pegboard.
export function CueRack() {
  return (
    <Morph phase="night" delay={0.1} {...LAYOUT.cueRack}>
      <Model name="cueRack" />
    </Morph>
  )
}

export function NightSign() {
  return (
    <Morph phase="night" delay={0.14} {...LAYOUT.nightSign}>
      <Box radius={0.015} size={[1.5, 0.42, 0.04]} position={[0, 0, 0.02]} color="#efe3cc" />
      <Panel
        size={[1.44, 0.38]}
        map={signTexture('DELL BAR', { bg: '#efe3cc', fg: '#b3201c', border: '#3f7d3a', font: 'bold 150px Georgia, serif' })}
        position={[0, 0, 0.042]}
      />
    </Morph>
  )
}

function PlasticChair({ rotation = 0, ...props }) {
  return <Model name="plasticChair" rotation={[0, rotation, 0]} {...props} />
}

// Amber long-neck after the reference photo: straight body with a bead under
// the shoulder and another above the heel, rounded shoulder, long tapering
// neck, a ring and the crown finish, and a crimped silver cap. No label.
// Profile traced from the photo in its pixels (radius, height from the
// photo's top), scaled to a 29 cm bottle.
const PX = 0.29 / 1435
const BOTTLE_PROFILE = [
  [0, 1450], [185, 1450], [203, 1436], [207, 1405], [207, 1300], [203, 1292], [207, 1284], [207, 760], [202, 752],
  [207, 744], [205, 680], [196, 630], [178, 590], [150, 560], [118, 540], [98, 520], [90, 450], [80, 330], [72, 200],
  [68, 150], [75, 135], [82, 116], [80, 96], [68, 82], [66, 70], [74, 58], [0, 58],
].map(([r, y]) => new THREE.Vector2(r * PX, (1450 - y) * PX))
const bottleGeometry = new THREE.LatheGeometry(BOTTLE_PROFILE, 40)
const CAP_Y = (1450 - 37) * PX
// a faint amber glow stands in for light passing through the glass
const amberGlass = new THREE.MeshPhysicalMaterial({
  color: '#4e1d08', emissive: '#6b2406', emissiveIntensity: 0.45, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6,
})
const capMetal = new THREE.MeshStandardMaterial({ color: '#d4d7db', metalness: 0.9, roughness: 0.28, flatShading: true })

export function BeerBottle(props) {
  return (
    <group {...props}>
      <mesh geometry={bottleGeometry} material={amberGlass} castShadow />
      {/* crown cap: 21 crimps around the skirt, flat top */}
      <mesh position={[0, CAP_Y, 0]} material={capMetal} castShadow>
        <cylinderGeometry args={[86 * PX, 90 * PX, 40 * PX, 21]} />
      </mesh>
    </group>
  )
}

// Copo americano: the small faceted tumbler, poured to a thin head of foam.
export function BeerGlass({ fill = 0.82, ...props }) {
  const h = 0.105
  const beer = h * fill
  return (
    <group {...props}>
      <mesh position={[0, h / 2, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.036, 0.029, h, 12, 1, true]} />
        <meshStandardMaterial color="#f4fbff" transparent opacity={0.28} roughness={0.05} metalness={0.1} flatShading side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, beer / 2 + 0.004, 0]}>
        <cylinderGeometry args={[0.029 + 0.0066 * fill, 0.0275, beer, 12]} />
        <meshStandardMaterial color="#f5b532" emissive="#c27a0c" emissiveIntensity={0.55} roughness={0.2} />
      </mesh>
      <Cyl r={0.0345} rTop={0.035} h={0.012} seg={24} color="#fffaf0" position={[0, beer + 0.009, 0]} mat={{ roughness: 0.9 }} />
      <Cyl r={0.029} h={0.004} seg={24} color="#e9f3f6" position={[0, 0.002, 0]} mat={{ transparent: true, opacity: 0.5 }} />
    </group>
  )
}

function PlasticTable({ seats = [0, Math.PI / 2, Math.PI], ...props }) {
  return (
    <group {...props}>
      <Model name="plasticTable" />
      <group position={[0, 0.735, 0]}>
        {/* a beer bottle, two glasses and a plate of peanuts */}
        <BeerBottle position={[0.05, 0, 0.05]} rotation={[0, 0.6, 0]} />
        <BeerGlass position={[-0.15, 0, 0.1]} />
        <BeerGlass position={[0.18, 0, -0.12]} fill={0.55} />
        <Cyl r={0.09} h={0.015} color="#f4f1de" position={[-0.08, 0.008, -0.15]} />
        <Cyl r={0.06} h={0.02} color="#b5793a" position={[-0.08, 0.02, -0.15]} />
      </group>
      {seats.map((a, i) => (
        <PlasticChair key={i} position={[Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62]} rotation={a + Math.PI} />
      ))}
    </group>
  )
}

// "Senta aí": the informal contact corner, where the lounge is during the day.
export function PlasticTables() {
  return (
    <Morph phase="night" delay={0.03} {...LAYOUT.plastic}>
      <Hotspot id="mesa" label="Senta aí" marker={[0, 1.35, 0]}>
        {LAYOUT.plasticTables.map((t, i) => (
          <PlasticTable key={i} {...t} />
        ))}
      </Hotspot>
    </Morph>
  )
}

// Bare fluorescent tube over the bar.
export function FluorescentTube() {
  return (
    <Morph phase="night" delay={0.16} {...LAYOUT.tube}>
      {/* slim dark batten with a long warm tube, as in the reference */}
      <Box radius={0.01} size={[2.6, 0.04, 0.07]} color="#2b2622" mat={{ metalness: 0.5, roughness: 0.45 }} />
      <Cyl r={0.017} h={2.45} color="#ffd9a0" position={[0, -0.03, 0.025]} rotation={[0, 0, Math.PI / 2]} mat={{ emissive: '#ffcf8a', emissiveIntensity: 0.55 }} />
      {[-1.2, 1.2].map((x) => (
        <Cyl key={x} r={0.02} h={0.03} color="#2b2622" position={[x, -0.03, 0.025]} rotation={[0, 0, Math.PI / 2]} />
      ))}
    </Morph>
  )
}
