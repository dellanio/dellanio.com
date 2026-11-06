import React, { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { Box, Ball, Cyl, Morph } from '../primitives'
import { LAYOUT } from '../layout'
import { setLang, useLang } from '../../i18n'

// Desk flags on the right-hand end of the desk, after the reference: a walnut
// base, two brass poles leaning apart, Brazil and the USA. Clicking one sets
// the site language (Portuguese is the default).
const CLOTH_W = 0.085
const CLOTH_H = 0.057
const POLE_H = 0.2
const BRASS = { color: '#c9a14a', metalness: 0.85, roughness: 0.3 }

function flagTexture(draw) {
  const c = document.createElement('canvas')
  c.width = 300
  c.height = 200
  draw(c.getContext('2d'), 300, 200)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function drawBrazil(g, w, h) {
  g.fillStyle = '#009b3a'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#fedf00'
  g.beginPath()
  g.moveTo(w * 0.085, h / 2)
  g.lineTo(w / 2, h * 0.115)
  g.lineTo(w * 0.915, h / 2)
  g.lineTo(w / 2, h * 0.885)
  g.closePath()
  g.fill()
  const r = h * 0.25
  g.fillStyle = '#002776'
  g.beginPath()
  g.arc(w / 2, h / 2, r, 0, Math.PI * 2)
  g.fill()
  // the white band arcing across the globe
  g.save()
  g.beginPath()
  g.arc(w / 2, h / 2, r, 0, Math.PI * 2)
  g.clip()
  g.strokeStyle = '#ffffff'
  g.lineWidth = h * 0.04
  g.beginPath()
  g.arc(w / 2 - r * 0.15, h / 2 + r * 1.9, r * 2.1, Math.PI * 1.22, Math.PI * 1.78)
  g.stroke()
  g.fillStyle = '#ffffff'
  for (const [x, y] of [[0.1, 0.45], [-0.35, 0.35], [-0.15, 0.55], [0.35, 0.5], [0.2, 0.7], [-0.4, 0.7], [0.5, 0.25]]) {
    g.beginPath()
    g.arc(w / 2 + x * r, h / 2 + y * r, 2.2, 0, Math.PI * 2)
    g.fill()
  }
  g.restore()
}

function drawUSA(g, w, h) {
  const stripe = h / 13
  for (let i = 0; i < 13; i++) {
    g.fillStyle = i % 2 ? '#ffffff' : '#b22234'
    g.fillRect(0, i * stripe, w, stripe + 0.5)
  }
  const cw = w * 0.4
  const ch = stripe * 7
  g.fillStyle = '#3c3b6e'
  g.fillRect(0, 0, cw, ch)
  g.fillStyle = '#ffffff'
  for (let row = 0; row < 9; row++) {
    const n = row % 2 ? 5 : 6
    for (let i = 0; i < n; i++) {
      const x = (cw / 12) * (row % 2 ? 2 + i * 2 : 1 + i * 2)
      const y = (ch / 10) * (row + 1)
      g.beginPath()
      g.arc(x, y, 2.6, 0, Math.PI * 2)
      g.fill()
    }
  }
}

// A cloth that hangs from the pole with a gentle ripple, hoist at x = 0.
function clothGeometry() {
  const geo = new THREE.PlaneGeometry(CLOTH_W, CLOTH_H, 16, 4)
  geo.translate(CLOTH_W / 2, 0, 0)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / CLOTH_W
    p.setZ(i, Math.sin(u * Math.PI * 1.6) * 0.006 * u)
    p.setY(i, p.getY(i) - 0.005 * u * u)
  }
  geo.computeVertexNormals()
  return geo
}

function Flag({ lang, draw, label, lean, ...props }) {
  const current = useLang()
  const [hover, setHover] = useState(false)
  const { geometry, map } = useMemo(() => ({ geometry: clothGeometry(), map: flagTexture(draw) }), [draw])
  const active = current === lang
  return (
    <group
      {...props}
      rotation={[0, 0, lean]}
      onClick={(e) => {
        e.stopPropagation()
        setLang(lang)
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
      <Cyl r={0.0024} h={POLE_H} seg={12} position={[0, POLE_H / 2, 0]} mat={BRASS} />
      <Ball r={0.0065} position={[0, POLE_H + 0.004, 0]} mat={BRASS} />
      <group position={[0.003, POLE_H - 0.012 - CLOTH_H / 2, 0]} scale={hover ? 1.12 : 1}>
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial map={map} side={THREE.DoubleSide} roughness={0.85} emissive="#ffffff" emissiveMap={map} emissiveIntensity={active ? 0.12 : 0} />
        </mesh>
      </group>
      {/* generous invisible target: the real flags are tiny */}
      <mesh position={[CLOTH_W / 2, POLE_H * 0.7, 0]}>
        <boxGeometry args={[CLOTH_W + 0.03, POLE_H * 0.7, 0.04]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {hover && (
        <Html position={[CLOTH_W / 2, POLE_H + 0.05, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="hotspot-label">{label}</div>
        </Html>
      )}
    </group>
  )
}

export function DeskFlags() {
  const [sx, sy, sz] = LAYOUT.desk.scale
  // desk-frame spot in front of the succulent; its own group so the desk's
  // non-uniform scale doesn't squash the flags
  return (
    <Morph phase="day" delay={0.06} position={LAYOUT.desk.position} rotation={LAYOUT.desk.rotation}>
      <group position={[1.04 * sx, 0.795 * sy, -0.1 * sz]} rotation={[0, -0.45, 0]} userData={{ noMerge: true }}>
        <Box radius={0.004} size={[0.11, 0.014, 0.045]} position={[0, 0.007, 0]} color="#5a3620" mat={{ roughness: 0.5 }} />
        <Flag lang="pt" draw={drawBrazil} label="Português" lean={0.12} position={[-0.022, 0.014, 0]} />
        <Flag lang="en" draw={drawUSA} label="English" lean={-0.08} position={[0.022, 0.014, 0]} />
      </group>
    </Morph>
  )
}
