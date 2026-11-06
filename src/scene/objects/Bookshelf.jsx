import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Ball, Cyl, Morph, Hotspot } from '../primitives'
import { LAYOUT } from '../layout'
import { Model } from '../Model'
import { ShelfBooks } from './Books'

const SHELF_Y = [1.55, 2.05, 2.55]
// the model's generic books give way to the titled ones in ./Books
const HIDE_MODEL_BOOKS = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`book_${i}`, { visible: false }]))

// Yellow cockatiel (calopsita) that bobs its head now and then.
export function Cockatiel(props) {
  const head = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    head.current.rotation.y = Math.sin(t * 0.7) * 0.6
    head.current.rotation.z = Math.max(0, Math.sin(t * 2.3)) * 0.2
  })
  return (
    <group {...props} userData={{ noMerge: true }}>
      <Ball r={0.06} color="#f3d35c" scale={[0.85, 1.15, 0.85]} position={[0, 0.07, 0]} />
      <mesh position={[0, 0.03, 0.06]} rotation={[0.9, 0, 0]} castShadow>
        <coneGeometry args={[0.025, 0.14, 8]} />
        <meshStandardMaterial color="#d9b94a" />
      </mesh>
      <group ref={head} position={[0, 0.15, 0]}>
        <Ball r={0.042} color="#f6e27a" />
        <Ball r={0.013} color="#f26b3a" position={[0.03, -0.005, 0.02]} />
        <Ball r={0.013} color="#f26b3a" position={[-0.03, -0.005, 0.02]} />
        <Ball r={0.006} color="#111" position={[0.028, 0.01, 0.026]} />
        <Ball r={0.006} color="#111" position={[-0.028, 0.01, 0.026]} />
        <mesh position={[0, -0.005, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.012, 0.025, 6]} />
          <meshStandardMaterial color="#b9a58a" />
        </mesh>
        {/* crest */}
        {[0, 0.25, -0.25].map((a, i) => (
          <mesh key={i} position={[0, 0.06, -0.01]} rotation={[-0.5, 0, a]} castShadow>
            <coneGeometry args={[0.008, 0.08, 5]} />
            <meshStandardMaterial color="#f3d35c" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function SmallPlant(props) {
  return (
    <group {...props}>
      <Cyl r={0.05} rTop={0.06} h={0.1} color="#c8643c" position={[0, 0.05, 0]} />
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i) * 0.04, 0.16, Math.sin(i) * 0.04]} rotation={[Math.cos(i) * 0.5, i, Math.sin(i) * 0.5]} castShadow>
          <coneGeometry args={[0.025, 0.16, 4]} />
          <meshStandardMaterial color="#4f8a4a" flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Bookshelf() {
  return (
    <Morph phase="day" delay={0.12} {...LAYOUT.bookshelf}>
      <Hotspot id="sobre" label="Sobre" marker={[0, 3.05, 0.1]}>
        <Model name="bookshelf" materials={HIDE_MODEL_BOOKS} fallback={<BookshelfFallback />} />
        <ShelfBooks />
        <SmallPlant position={[0.42, 2.57, 0.02]} />
      </Hotspot>
    </Morph>
  )
}

function BookshelfFallback() {
  return (
    <>
        {SHELF_Y.map((y) => (
          <group key={y}>
            <Box size={[1.2, 0.04, 0.3]} position={[0, y, 0]} color="#7a4e2d" />
            <Box size={[0.03, 0.12, 0.25]} position={[-0.45, y - 0.08, -0.02]} color="#2b2b2b" />
            <Box size={[0.03, 0.12, 0.25]} position={[0.45, y - 0.08, -0.02]} color="#2b2b2b" />
          </group>
        ))}
    </>
  )
}
