import * as THREE from 'three'
import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Morph, Hotspot } from '../primitives'
import { LAYOUT } from '../layout'
import { Model } from '../Model'

// Upright arcade cabinet (Meshy, from the owner's reference with the screen
// blanked). The screen is a canvas running an attract mode of our own: a
// self-playing brick breaker, a title and a blinking INSERT COIN.

// Screen panel in the cabinet's own space, measured on the model: 0.60 wide,
// leaning back about 18°, in front of the curved glass.
const SCREEN = { size: [0.56, 0.4], position: [0, 1.195, 0.05], rotation: [-0.31, 0, 0] }

const W = 320
const H = 228
const COLS = 10
const ROWS = 5
const BRICK_W = 28
const BRICK_H = 10
const TOP = 46
const LEFT = (W - COLS * BRICK_W) / 2
const ROW_COLORS = ['#ff4d6d', '#ff9f1c', '#ffd60a', '#4cd137', '#3fa7ff']

function newDemo() {
  return {
    bricks: Array.from({ length: ROWS * COLS }, () => true),
    ball: { x: W / 2, y: 170, vx: 95, vy: -120 },
    paddle: W / 2,
    score: 0,
    t: 0,
  }
}

function step(d, dt) {
  const b = d.ball
  d.t += dt
  b.x += b.vx * dt
  b.y += b.vy * dt
  if (b.x < 4 || b.x > W - 4) b.vx *= -1
  if (b.y < 26) b.vy = Math.abs(b.vy)
  // the demo player never misses: the paddle follows the ball
  d.paddle += (b.x - d.paddle) * Math.min(1, dt * 7)
  if (b.y > 196 && b.vy > 0) {
    b.vy = -Math.abs(b.vy)
    b.vx = (b.x - d.paddle) * 4 + (Math.random() - 0.5) * 30
  }
  const c = Math.floor((b.x - LEFT) / BRICK_W)
  const r = Math.floor((b.y - TOP) / BRICK_H)
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS && d.bricks[r * COLS + c]) {
    d.bricks[r * COLS + c] = false
    b.vy *= -1
    d.score += 10 * (ROWS - r)
  }
  if (!d.bricks.some(Boolean)) Object.assign(d, newDemo(), { score: d.score })
}

function draw(g, d) {
  g.fillStyle = '#05060f'
  g.fillRect(0, 0, W, H)
  g.font = 'bold 11px monospace'
  g.textBaseline = 'top'
  g.fillStyle = '#ffffff'
  g.fillText(`1UP ${String(d.score).padStart(6, '0')}`, 8, 6)
  g.fillStyle = '#ff4d6d'
  g.fillText('HI 099990', W - 72, 6)
  g.fillStyle = '#ffd60a'
  g.textAlign = 'center'
  g.font = 'bold 14px monospace'
  g.fillText('DELL BAR ARCADE', W / 2, 22)
  g.textAlign = 'left'
  d.bricks.forEach((on, i) => {
    if (!on) return
    const r = Math.floor(i / COLS)
    g.fillStyle = ROW_COLORS[r]
    g.fillRect(LEFT + (i % COLS) * BRICK_W + 1, TOP + r * BRICK_H + 1, BRICK_W - 2, BRICK_H - 2)
  })
  g.fillStyle = '#e8f1ff'
  g.fillRect(d.paddle - 18, 198, 36, 5)
  g.beginPath()
  g.arc(d.ball.x, d.ball.y, 3, 0, Math.PI * 2)
  g.fill()
  if (Math.floor(d.t * 1.6) % 2 === 0) {
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = 'bold 12px monospace'
    g.fillText('INSERT COIN', W / 2, 212)
    g.textAlign = 'left'
  }
  // CRT scanlines
  g.fillStyle = 'rgba(0,0,0,0.28)'
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1)
}

function ArcadeScreen() {
  const { texture, demo, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    return { texture, demo: newDemo(), ctx: canvas.getContext('2d') }
  }, [])
  useFrame((_, delta) => {
    // ~20 fps is plenty for a CRT demo and keeps uploads cheap
    demo.acc = (demo.acc ?? 0) + Math.min(delta, 0.1)
    if (demo.acc < 0.05) return
    step(demo, demo.acc)
    demo.acc = 0
    draw(ctx, demo)
    texture.needsUpdate = true
  })
  return (
    <mesh {...SCREEN} userData={{ noMerge: true }}>
      <planeGeometry args={SCREEN.size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export function Arcade() {
  return (
    <Morph phase="night" delay={0.08} {...LAYOUT.arcade}>
      <Hotspot id="fliperama" label="Fliperama" marker={[0, 2.0, 0.2]}>
        <Model name="arcade" />
        <ArcadeScreen />
      </Hotspot>
    </Morph>
  )
}
