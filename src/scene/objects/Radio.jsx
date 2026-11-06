import React, { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { getRadio, toggleRadio } from '../../radio'
import { useLang } from '../../i18n'
import { UI } from '../../content'

// The old radio on the bottle shelf (part of the shelf model; this sits in the
// shelf's own frame): click it to switch the stream on or off, and while it
// plays, music notes drift up out of it so the sound has a source.
const RADIO = [-0.43, 2.67, 0.02] // centre of the radio cabinet on the top shelf
const NOTES = 7
const RISE = 0.55 // metres a note climbs before it fades out
const LIFE = 2.6 // seconds per note

let noteTextures
function textures() {
  if (noteTextures) return noteTextures
  noteTextures = ['♪', '♫', '♩'].map((glyph) => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    g.font = 'bold 96px "Segoe UI Symbol", "Noto Music", "Apple Symbols", serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.lineWidth = 8
    g.strokeStyle = 'rgba(40, 22, 8, 0.55)'
    g.strokeText(glyph, 64, 68)
    g.fillStyle = '#ffd98a'
    g.fillText(glyph, 64, 68)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })
  return noteTextures
}

function Notes() {
  const sprites = useRef([])
  const materials = useMemo(
    () =>
      Array.from({ length: NOTES }, (_, i) => new THREE.SpriteMaterial({ map: textures()[i % 3], transparent: true, opacity: 0, depthWrite: false, toneMapped: false })),
    [],
  )
  // fade in/out of the whole stream, so notes don't pop when it starts or stops
  const level = useRef(0)
  useFrame((state, delta) => {
    const on = getRadio().status === 'playing'
    level.current += ((on ? 1 : 0) - level.current) * Math.min(1, delta * 2)
    const t = state.clock.elapsedTime
    sprites.current.forEach((s, i) => {
      if (!s) return
      const p = ((t / LIFE + i / NOTES) % 1 + 1) % 1 // 0..1 through this note's life
      const side = i % 2 ? 1 : -1
      s.position.set(Math.sin(p * Math.PI * 2 + i) * 0.06 * side + (i - NOTES / 2) * 0.012, p * RISE, Math.cos(p * 5 + i) * 0.02)
      const size = 0.05 + 0.03 * Math.sin(p * Math.PI)
      s.scale.set(size, size, 1)
      // fade in over the first fifth, out over the last third
      const fade = Math.min(1, p / 0.2) * Math.min(1, (1 - p) / 0.35)
      materials[i].opacity = fade * level.current
      materials[i].rotation = Math.sin(t * 2 + i) * 0.35
      s.visible = materials[i].opacity > 0.01
    })
  })
  return (
    <group position={[0.06, 0.06, 0.05]}>
      {materials.map((m, i) => (
        <sprite key={i} ref={(s) => (sprites.current[i] = s)} material={m} />
      ))}
    </group>
  )
}

export function ShelfRadio() {
  const lang = useLang()
  const [hover, setHover] = useState(false)
  return (
    <group position={RADIO} userData={{ noMerge: true }}>
      {/* invisible, generous click target over the radio */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          toggleRadio()
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
        <boxGeometry args={[0.4, 0.3, 0.24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Notes />
      {hover && (
        <Html position={[0, 0.3, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="hotspot-label">📻 {UI[lang].radio.hint}</div>
        </Html>
      )}
    </group>
  )
}
