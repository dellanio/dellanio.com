import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { W, H, R, BALL_COLORS, update, cueBall, traceAim, canPlaceCue, placeCue, shoot } from './pool'
import { pool, notify, usePool } from './store'
import { chooseShot, choosePlacement } from './ai'
import { tr } from '../i18n'
import { playPoolEvents } from './sound'
import { requestPoolShadow } from '../scene/state'

// The 8-ball match played on the 3D table itself. The engine works in "table
// pixels" (W x H cloth); here 1000 px = the 2.29 m between the cushions of the
// Blender table, whose pockets were cut at the engine's pocket positions.
const S = 2.29 / W
const BED = 0.83 // cloth height in the table's local frame
const BR = R * S
const Y = BED + BR
const toX = (u) => (u - W / 2) * S
const toZ = (v) => (v - H / 2) * S

// Equirectangular ball skin: solid or striped, with the number on two sides.
function ballTexture(id) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = id === 0 || id > 8 ? '#f8f6ee' : BALL_COLORS[id]
  ctx.fillRect(0, 0, 256, 128)
  if (id > 8) {
    ctx.fillStyle = BALL_COLORS[id]
    ctx.fillRect(0, 36, 256, 56)
  }
  if (id !== 0)
    for (const x of [64, 192]) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(x, 64, 20, 22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.font = 'bold 26px Segoe UI, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(id), x, 66)
    }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Soft contact shadow under each ball: what really seats a ball on the cloth
// (the lamp's shadow map alone is too coarse at this size).
let contactTex
function contactShadowTexture() {
  if (contactTex) return contactTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(0,0,0,0.75)')
  grad.addColorStop(0.45, 'rgba(0,0,0,0.45)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  contactTex = new THREE.CanvasTexture(c)
  return contactTex
}

const UP = new THREE.Vector3(0, 1, 0)
const axis = new THREE.Vector3()
const spin = new THREE.Quaternion()

function Balls() {
  const meshes = useRef([])
  const shadows = useRef([])
  const last = useRef([])
  const shadowMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false }), [])
  const shadowGeometry = useMemo(() => new THREE.PlaneGeometry(BR * 2.6, BR * 2.6).rotateX(-Math.PI / 2), [])
  const geometry = useMemo(() => new THREE.SphereGeometry(BR, 32, 16), [])
  const materials = useMemo(
    () => Array.from({ length: 16 }, (_, id) => new THREE.MeshStandardMaterial({ map: ballTexture(id), roughness: 0.12, metalness: 0 })),
    [],
  )
  useFrame(() => {
    const g = pool.game
    for (const b of g.balls) {
      const m = meshes.current[b.id]
      if (!m) continue
      const wasVisible = m.visible
      m.visible = !b.potted
      const x = toX(b.x)
      const z = toZ(b.y)
      const prev = last.current[b.id]
      if (prev && !b.potted) {
        // roll: turn about the axis perpendicular to the travel, by distance / radius
        const dx = x - prev[0]
        const dz = z - prev[1]
        const d = Math.hypot(dx, dz)
        if (d > 1e-6 && d < 0.5) {
          axis.set(dz, 0, -dx).normalize()
          m.quaternion.premultiply(spin.setFromAxisAngle(axis, d / BR))
        }
      }
      if (!prev || prev[0] !== x || prev[1] !== z || wasVisible !== m.visible) requestPoolShadow()
      last.current[b.id] = [x, z]
      m.position.set(x, Y, z)
      const sh = shadows.current[b.id]
      if (sh) {
        sh.visible = m.visible
        sh.position.set(x, BED + 0.0008, z)
      }
    }
  })
  return Array.from({ length: 16 }, (_, id) => (
    <group key={id}>
      <mesh
        ref={(m) => (meshes.current[id] = m)}
        geometry={geometry}
        material={materials[id]}
        rotation={[id * 0.7, id * 1.3, Math.PI / 2]} // numbers up, each ball a little different
        castShadow
      />
      <mesh ref={(m) => (shadows.current[id] = m)} geometry={shadowGeometry} material={shadowMaterial} renderOrder={1} />
    </group>
  ))
}

// Cue stick, aim line and ghost ball while the player is aiming.
function AimGuides() {
  const cue = useRef()
  const line = useRef()
  const ghost = useRef()
  const objectLine = useRef()
  useFrame(() => {
    const g = pool.game
    const a = pool.aim
    const show = pool.playing && g.phase === 'aim'
    cue.current.visible = line.current.visible = ghost.current.visible = show
    objectLine.current.visible = false
    if (!show) return
    requestPoolShadow() // the cue casts a shadow while aiming
    const c = cueBall(g)
    const cx = toX(c.x)
    const cz = toZ(c.y)
    cue.current.position.set(cx, Y, cz)
    cue.current.rotation.set(0, -a.angle, 0)
    cue.current.children[0].position.x = -(BR + 0.015 + a.pull * 0.28)

    const hit = traceAim(g, a.angle)
    const hx = toX(hit.x)
    const hz = toZ(hit.y)
    const len = Math.hypot(hx - cx, hz - cz)
    line.current.position.set((cx + hx) / 2, BED + 0.002, (cz + hz) / 2)
    line.current.rotation.set(-Math.PI / 2, 0, -a.angle)
    line.current.scale.set(Math.max(len, 0.001), 1, 1)
    ghost.current.position.set(hx, BED + 0.003, hz)
    if (hit.ball) {
      const ox = toX(hit.ball.x)
      const oz = toZ(hit.ball.y)
      const ang = Math.atan2(hit.ny, hit.nx)
      objectLine.current.visible = true
      objectLine.current.position.set(ox + Math.cos(ang) * 0.11, BED + 0.002, oz + Math.sin(ang) * 0.11)
      objectLine.current.rotation.set(-Math.PI / 2, 0, -ang)
    }
  })
  return (
    <group userData={{ noMerge: true }}>
      <group ref={cue}>
        {/* tip at the local origin side, the butt away from the ball; tilted up like a real stroke */}
        <group rotation={[0, 0, -0.06]}>
          {/* turned on z, a cylinder's top points to -x: top radius = butt side, bottom = tip side */}
          <mesh position={[-0.72, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.0125, 0.0058, 1.44, 16]} />
            <meshStandardMaterial color="#d9b27a" roughness={0.35} />
          </mesh>
          <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0145, 0.0126, 0.48, 16]} />
            <meshStandardMaterial color="#2b1a10" roughness={0.3} />
          </mesh>
          {/* white ferrule and the blue chalked leather tip */}
          <mesh position={[-0.016, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.02, 14]} />
            <meshStandardMaterial color="#f2efe6" roughness={0.4} />
          </mesh>
          <mesh position={[-0.003, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0058, 0.0056, 0.006, 14]} />
            <meshStandardMaterial color="#3a6ea8" roughness={0.8} />
          </mesh>
        </group>
      </group>
      <mesh ref={line}>
        <planeGeometry args={[1, 0.004]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh ref={ghost} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BR * 0.88, BR, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <mesh ref={objectLine}>
        <planeGeometry args={[0.2, 0.004]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  )
}

// Invisible catcher over the table: aim with the pointer, press, pull back, release.
function Controls({ root }) {
  const toTable = (e) => {
    const p = root.current.worldToLocal(e.point.clone())
    return { x: p.x / S + W / 2, y: p.z / S + H / 2 }
  }
  const onMove = (e) => {
    e.stopPropagation()
    const g = pool.game
    if (g.current === 1) return // the AI's turn
    const a = pool.aim
    const p = toTable(e)
    if (g.phase === 'ballInHand') {
      if (canPlaceCue(g, p.x, p.y)) Object.assign(cueBall(g), { x: p.x, y: p.y })
      return
    }
    if (g.phase !== 'aim') return
    const c = cueBall(g)
    if (a.dragging) {
      // pulling back along the locked aim line sets the power
      const back = -((p.x - a.startX) * Math.cos(a.angle) + (p.y - a.startY) * Math.sin(a.angle))
      a.pull = Math.max(0, Math.min(1, back / 260))
    } else a.angle = Math.atan2(p.y - c.y, p.x - c.x)
  }
  const onDown = (e) => {
    e.stopPropagation()
    const g = pool.game
    if (g.current === 1) return
    const a = pool.aim
    const p = toTable(e)
    try {
      e.target.setPointerCapture(e.pointerId)
    } catch {
      // synthetic or vanished pointer: the drag still works over the table
    }
    if (g.phase === 'ballInHand') {
      if (canPlaceCue(g, p.x, p.y)) {
        placeCue(g, p.x, p.y)
        g.message = tr('Branca posicionada. Sua vez.', 'Cue ball placed. Your turn.')
        notify()
      }
      return
    }
    if (g.phase !== 'aim') return
    const c = cueBall(g)
    if (e.pointerType !== 'mouse') a.angle = Math.atan2(p.y - c.y, p.x - c.x)
    Object.assign(a, { dragging: true, startX: p.x, startY: p.y, pull: 0 })
  }
  const onUp = (e) => {
    e.stopPropagation()
    const g = pool.game
    const a = pool.aim
    try {
      e.target.releasePointerCapture(e.pointerId)
    } catch {
      // already released
    }
    if (!a.dragging) return
    a.dragging = false
    if (g.phase === 'aim' && a.pull > 0.03) {
      shoot(g, a.angle, a.pull)
      notify()
    }
    a.pull = 0
  }
  return (
    <mesh position={[0, Y, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={onMove} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp}>
      <planeGeometry args={[12, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const ease = (k) => k * k * (3 - 2 * k)

// Player 2: thinks for a moment, places the cue ball when it has ball in hand,
// swings the cue round to its line, draws back and strikes, all on screen.
function AiPlayer() {
  const ai = useRef({ stage: null })
  useFrame((three) => {
    const g = pool.game
    const a = pool.aim
    const s = ai.current
    const now = three.clock.elapsedTime
    if (!pool.playing || g.current !== 1 || (g.phase !== 'aim' && g.phase !== 'ballInHand')) {
      s.stage = null
      return
    }
    if (!s.stage) Object.assign(s, { stage: 'think', t0: now })
    if (s.stage === 'think' && now - s.t0 > 1.1) {
      if (g.phase === 'ballInHand') {
        const spot = choosePlacement(g, 1)
        placeCue(g, spot.x, spot.y)
        g.message = tr('A IA posicionou a branca…', 'The AI placed the cue ball…')
        notify()
      }
      Object.assign(s, { stage: 'aim', t0: now, shot: chooseShot(g, 1), from: a.angle })
      a.pull = 0
    } else if (s.stage === 'aim') {
      const k = Math.min(1, (now - s.t0) / 0.9)
      a.angle = s.from + wrapAngle(s.shot.angle - s.from) * ease(k)
      if (k === 1) Object.assign(s, { stage: 'pull', t0: now })
    } else if (s.stage === 'pull') {
      const k = Math.min(1, (now - s.t0) / 0.7)
      a.pull = s.shot.power * ease(k)
      if (k === 1) Object.assign(s, { stage: 'strike', t0: now })
    } else if (s.stage === 'strike' && now - s.t0 > 0.25) {
      a.pull = 0
      shoot(g, s.shot.angle, s.shot.power)
      s.stage = null
      notify()
    }
  })
  return null
}

export function Pool3D() {
  const root = useRef()
  const { playing } = usePool()
  const lastPhase = useRef(pool.game.phase)
  useFrame((_, delta) => {
    const g = pool.game
    update(g, delta)
    if (g.events?.length) playPoolEvents(g.events.splice(0))
    if (g.phase !== lastPhase.current) {
      lastPhase.current = g.phase
      notify()
    }
  })
  return (
    <group ref={root} userData={{ noMerge: true }}>
      <Balls />
      <AimGuides />
      {playing && <Controls root={root} />}
      <AiPlayer />
    </group>
  )
}
