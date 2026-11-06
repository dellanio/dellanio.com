import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Box, Cyl, Ball, Panel, Hotspot, Merge } from '../primitives'
import { Model } from '../Model'
import { timeState, lerp } from '../state'
import {
  herringboneTexture, darkPanelTexture, rugTexture, spineTexture, robotFaceTexture,
  cvTexture, portfolioTexture, dashboardTexture,
} from '../textures'
import { Cockatiel } from './Bookshelf'
import { BridgeModel, Camera } from './Sideboard'
import { HangingPlant } from './Lounge'
import { DAY_ORIGIN } from '../layout'

// The robot office from the reference photo, built as its own room next to the
// boteco: at 18h the camera travels from one to the other.
// Local frame: back wall at z = -3 (faces +z), left wall at x = LW (faces +x).
// Camera and every position were solved from the photo's two vanishing points
// (focal 1225 px) and the window/board rectangles, then cast back pixel by pixel.
const H = 3.6
const T = 0.2
const LED = { color: '#ffc27a', emissive: '#ffb25e', emissiveIntensity: 2.6, toneMapped: false }
export const DAY_WINDOW = { x0: -0.75, x1: 3.83, y0: 1.13, y1: 3.45 }
const LW = -0.78 // left wall plane

function useTex(url) {
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(url)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [url])
  return tex
}

function Wall({ size, ...props }) {
  const map = useMemo(() => {
    const t = darkPanelTexture().clone()
    t.repeat.set(Math.max(size[0], size[2]) / 2, size[1] / 3.6)
    t.needsUpdate = true
    return t
  }, [size])
  return (
    <Box size={size} {...props}>
      <meshStandardMaterial map={map} roughness={0.8} />
    </Box>
  )
}

function Shell() {
  const { x0, x1, y0, y1 } = DAY_WINDOW
  const z = -3 - T / 2
  const floor = useMemo(() => {
    const t = herringboneTexture().clone()
    t.repeat.set(9, 9)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0, 3]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={floor} roughness={0.55} />
      </mesh>
      {/* back wall with the window opening */}
      <Wall size={[x0 - LW + 0.2, H, T]} position={[(x0 + LW - 0.2) / 2, H / 2, z]} />
      <Wall size={[11 - x1, H, T]} position={[(11 + x1) / 2, H / 2, z]} />
      <Wall size={[x1 - x0, y0, T]} position={[(x0 + x1) / 2, y0 / 2, z]} />
      <Wall size={[x1 - x0, H - y1, T]} position={[(x0 + x1) / 2, (H + y1) / 2, z]} />
      {/* left wall and the pillar between window and board */}
      <Wall size={[T, H, 10]} position={[LW - T / 2, H / 2, 2]} />
      <Wall size={[0.18, H, 0.3]} position={[3.93, H / 2, -2.86]} />
      {/* LED cove along the left wall's top */}
      <Box size={[0.02, 0.02, 8]} position={[LW + 0.02, 3.3, 1]} shadows={false}>
        <meshStandardMaterial {...LED} />
      </Box>
    </group>
  )
}

// Big window with dark metal frame; the view is cropped from the reference photo.
function Window() {
  const { x0, x1, y0, y1 } = DAY_WINDOW
  const view = useTex('/textures/robot_window.jpg')
  const cx = (x0 + x1) / 2
  const frame = '#141414'
  return (
    <group>
      <mesh position={[cx, 2.35, -4.2]}>
        <planeGeometry args={[6.2, 3.04]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      <Box size={[x1 - x0 + 0.1, 0.07, 0.3]} position={[cx, y0, -2.95]} color={frame} />
      <Box size={[0.07, y1 - y0, 0.2]} position={[x0, (y0 + y1) / 2, -3]} color={frame} />
      <Box size={[0.07, y1 - y0, 0.2]} position={[x1, (y0 + y1) / 2, -3]} color={frame} />
      <Box size={[0.06, y1 - y0, 0.12]} position={[1.45, (y0 + y1) / 2, -3]} color={frame} />
      {/* evening light pouring in */}
      <pointLight position={[cx, 2.3, -2.6]} color="#ff9a55" intensity={4} distance={6} />
    </group>
  )
}

const BOOKS = [
  ['ARQUITETURA', '#3a3632'],
  ['DESIGN', '#26292d'],
  ['TECNOLOGIA', '#2d3a46'],
  ['BRASIL', '#383430'],
  ['CRIATIVIDADE', '#2a2724'],
]

function DeskLamp(props) {
  return (
    <group {...props}>
      <Cyl r={0.08} h={0.03} color="#141414" position={[0, 0.015, 0]} />
      <Box size={[0.025, 0.55, 0.025]} position={[0, 0.3, 0.06]} rotation={[0.25, 0, 0]} color="#141414" />
      <Box size={[0.025, 0.45, 0.025]} position={[0, 0.62, 0.3]} rotation={[-1.1, 0, 0]} color="#141414" />
      <mesh position={[0, 0.58, 0.55]} rotation={[0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.18, 20, 1, true]} />
        <meshStandardMaterial color="#141414" side={THREE.DoubleSide} />
      </mesh>
      <Ball r={0.035} position={[0, 0.54, 0.57]} mat={{ emissive: '#fff1d0', emissiveIntensity: 3, toneMapped: false }} />
      <pointLight position={[0, 0.45, 0.6]} color="#ffd9a0" intensity={3.5} distance={3.5} />
    </group>
  )
}

// Left wall: framed photos, the long shelf with books, cockatiel and lamp, smaller shelves.
function LeftWall() {
  const left = useTex('/textures/robot_frame_left.jpg')
  const right = useTex('/textures/robot_frame_right.jpg')
  return (
    <group position={[LW, 0, 0]}>
      {/* everything here faces +x (into the room) */}
      <group rotation={[0, Math.PI / 2, 0]}>
        {[
          [-0.15, left, [0.62, 0.83]],
          [-1.22, right, [0.75, 0.8]],
        ].map(([z, map, [w, h]]) => (
          <group key={z} position={[-z, 2.78, 0.03]}>
            <Box size={[w + 0.08, h + 0.08, 0.04]} color="#0f0f0f" />
            <Box size={[w, h, 0.005]} position={[0, 0, 0.022]} color="#f2efe8" shadows={false} />
            <Panel size={[w - 0.08, h - 0.08]} map={map} position={[0, 0, 0.026]} />
          </group>
        ))}
      </group>
      {/* long shelf with an LED strip under it */}
      <Box size={[0.34, 0.045, 3.6]} position={[0.17, 1.72, -0.37]} color="#1c1a19" />
      <Box size={[0.02, 0.012, 3.5]} position={[0.3, 1.69, -0.37]} shadows={false}>
        <meshStandardMaterial {...LED} />
      </Box>
      {/* five books lying flat, spines out */}
      <group position={[0.17, 1.745, 0.63]}>
        {BOOKS.map(([title, color], i) => (
          <group key={title} position={[0, 0.03 + i * 0.058, 0]} rotation={[0, (i % 2 ? 0.05 : -0.04), 0]}>
            <Box size={[0.26, 0.055, 0.42]} color={color} />
            <Panel size={[0.42, 0.05]} map={spineTexture(title, color)} position={[0.131, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          </group>
        ))}
        <Cockatiel position={[0.0, 0.32, -0.15]} rotation={[0, Math.PI / 2 + 0.4, 0]} />
      </group>
      <group position={[0.17, 1.745, 0.05]}>
        <Box size={[0.2, 0.3, 0.05]} position={[0, 0.15, 0]} color="#e9e4d8" />
        <Box size={[0.2, 0.26, 0.05]} position={[0, 0.13, 0.07]} color="#c94f3a" />
      </group>
      <DeskLamp position={[0.12, 1.745, -0.84]} rotation={[0, Math.PI / 2 + 0.6, 0]} />
      {/* small upper shelf with a plant, lower shelf with a bust */}
      <Box size={[0.3, 0.04, 0.9]} position={[0.15, 2.3, -1.85]} color="#1c1a19" />
      <Box size={[0.02, 0.012, 0.85]} position={[0.28, 2.27, -1.85]} shadows={false}>
        <meshStandardMaterial {...LED} />
      </Box>
      <Model name="plantWide" position={[0.15, 2.32, -1.85]} scale={0.42} />
      <Box size={[0.3, 0.04, 1.1]} position={[0.15, 1.06, 1.15]} color="#1c1a19" />
      <Box size={[0.02, 0.012, 1.05]} position={[0.28, 1.03, 1.15]} shadows={false}>
        <meshStandardMaterial {...LED} />
      </Box>
      <group position={[0.16, 1.08, 1.3]}>
        <Box size={[0.08, 0.1, 0.08]} position={[0, 0.05, 0]} color="#3a3a3a" />
        <Ball r={0.055} position={[0, 0.16, 0]} color="#4a4a4a" />
      </group>
      <group position={[0.35, 3.3, 1.0]} scale={[1.2, 2.6, 1.2]}>
        <HangingPlant />
      </group>
      <group position={[0.35, 3.3, 1.7]} scale={[1.1, 2.2, 1.1]}>
        <HangingPlant />
      </group>
    </group>
  )
}

// Experiences board: dark pegboard, LED border, the pinned projects.
function Board() {
  return (
    <group position={[5.18, 2.09, -2.97]}>
      <Hotspot id="portfolio" label="Portfólio" marker={[0, 0.98, 0.15]}>
        <Box size={[2.42, 1.36, 0.04]} color="#0f0f10" />
        <Box size={[2.46, 1.4, 0.02]} position={[0, 0, -0.012]} shadows={false}>
          <meshStandardMaterial {...LED} />
        </Box>
        <Panel size={[2.32, 1.16]} map={portfolioTexture()} position={[0, -0.02, 0.022]} />
      </Hotspot>
    </group>
  )
}

function SideboardDark() {
  const slats = useMemo(() => Array.from({ length: 34 }, (_, i) => -2.08 + i * 0.126), [])
  return (
    <group position={[6.27, 0, -2.72]}>
      <Box radius={0.02} size={[4.3, 0.6, 0.55]} position={[0, 0.32, 0]} color="#1b1b1c" />
      <Box size={[4.32, 0.03, 0.57]} position={[0, 0.635, 0]} color="#252526" />
      {slats.map((x) => (
        <Box key={x} size={[0.05, 0.5, 0.012]} position={[x, 0.32, 0.282]} color="#111112" shadows={false} />
      ))}
      <group position={[0, 0.65, 0]}>
        <Box size={[0.4, 0.06, 0.28]} position={[-1.56, 0.03, 0.02]} color="#d8d2c6" />
        <Camera position={[-1.56, 0.06, 0.04]} />
        <group scale={0.85}>
          <BridgeModel position={[-1.17, 0, 0]} />
        </group>
        {/* filament bulb lamp */}
        <Cyl r={0.08} h={0.04} color="#1a1a1a" position={[0.75, 0.02, 0.05]} />
        <Ball r={0.11} position={[0.75, 0.16, 0.05]} color="#ffcf8a" mat={{ transparent: true, opacity: 0.35, roughness: 0.05 }} />
        <Cyl r={0.008} h={0.1} position={[0.75, 0.15, 0.05]} mat={{ emissive: '#ffb25e', emissiveIntensity: 4, toneMapped: false }} />
        <pointLight position={[0.75, 0.2, 0.25]} color="#ffb25e" intensity={2.5} distance={3} />
        <Model name="plantTall" position={[1.65, 0, -0.02]} scale={0.95} />
      </group>
    </group>
  )
}

// Dark desk with the warm LED line under its edge.
function Desk() {
  const screen = cvTexture()
  return (
    <group position={[2.53, 0, 0.57]} rotation={[0, -0.05, 0]}>
      <Hotspot id="curriculo" label="Currículo" marker={[-0.4, 1.6, 0.0]}>
        <Box radius={0.035} size={[3.82, 0.07, 1.47]} position={[0, 0.775, 0]} color="#1d1d1f" mat={{ roughness: 0.4 }} />
        <Box radius={0.03} size={[3.7, 0.7, 1.35]} position={[0, 0.37, 0]} color="#222224" mat={{ roughness: 0.6 }} />
        <Box radius={0.01} size={[3.84, 0.012, 1.49]} position={[0, 0.735, 0]} shadows={false}>
          <meshStandardMaterial {...LED} />
        </Box>
        <Box size={[3.7, 0.012, 0.012]} position={[0, 0.015, 0.68]} shadows={false}>
          <meshStandardMaterial {...LED} />
        </Box>
        {/* monitor with the résumé */}
        <group position={[-0.4, 0.81, 0.05]} rotation={[0, 0.55, 0]}>
          <Box size={[0.3, 0.02, 0.2]} position={[0, 0, 0]} color="#151515" />
          <Box size={[0.05, 0.3, 0.04]} position={[0, 0.16, -0.04]} color="#151515" />
          <Box radius={0.012} size={[1.02, 0.62, 0.04]} position={[0, 0.58, 0]} color="#0e0e0e" />
          <Panel size={[0.96, 0.56]} map={screen} lit position={[0, 0.58, 0.022]} />
        </group>
        {/* keyboard, mouse, mug, pens, notebooks, tablet, plant, headphones, books */}
        <group position={[0, 0.81, 0]}>
          <Box radius={0.006} size={[0.6, 0.02, 0.2]} position={[0.08, 0.01, 0.1]} color="#1a1a1a" />
          <Box radius={0.01} size={[0.07, 0.025, 0.11]} position={[0.5, 0.012, 0.12]} color="#1a1a1a" />
          <Cyl r={0.05} h={0.1} color="#121212" position={[1.04, 0.05, -0.37]} />
          <Box size={[0.14, 0.008, 0.14]} position={[1.04, 0.004, -0.37]} color="#5a2a1a" />
          <Cyl r={0.04} h={0.11} color="#151515" position={[-0.05, 0.055, 0.45]} />
          <Box radius={0.004} size={[0.34, 0.03, 0.24]} position={[0.28, 0.015, 0.5]} color="#2a2a2a" />
          <Box radius={0.004} size={[0.3, 0.03, 0.22]} position={[0.3, 0.045, 0.5]} rotation={[0, 0.1, 0]} color="#3a3a3a" />
          <group position={[1.25, 0, -0.45]} rotation={[0, -0.6, 0]}>
            <Box radius={0.01} size={[0.3, 0.42, 0.02]} position={[0, 0.2, 0]} rotation={[-0.2, 0, 0]} color="#0e0e0e" />
            <Panel size={[0.27, 0.38]} map={dashboardTexture()} lit position={[0, 0.2, 0.012]} rotation={[-0.2, 0, 0]} />
          </group>
          <Model name="succulent" position={[1.6, 0, -0.3]} scale={0.8} />
          <group position={[-1.75, 0, 0.1]}>
            <Cyl r={0.05} h={0.02} color="#151515" position={[0, 0.01, 0]} />
            <Cyl r={0.01} h={0.28} color="#151515" position={[0, 0.15, 0]} />
            <mesh position={[0, 0.27, 0]} rotation={[0, 0, 0]} castShadow>
              <torusGeometry args={[0.09, 0.018, 8, 20, Math.PI]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          </group>
          <Box radius={0.004} size={[0.34, 0.05, 0.26]} position={[-1.6, 0.025, 0.3]} color="#2e2e2e" />
          <Box radius={0.004} size={[0.3, 0.04, 0.24]} position={[-1.6, 0.07, 0.3]} rotation={[0, 0.15, 0]} color="#3d3a36" />
        </group>
      </Hotspot>
    </group>
  )
}

// The site's mascot: white robot in a mesh chair, waving.
function Robot() {
  const wave = useRef()
  const head = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    wave.current.rotation.z = 2.35 + Math.sin(t * 5) * 0.28
    head.current.rotation.z = Math.sin(t * 1.3) * 0.06
    head.current.rotation.y = Math.sin(t * 0.7) * 0.15
  })
  const white = { color: '#efece6', mat: { roughness: 0.25, metalness: 0.05 } }
  const joint = '#2a2a2c'
  const pink = { emissive: '#ff6fbf', emissiveIntensity: 2.5, toneMapped: false }
  return (
    <group position={[2.0, 0, -0.95]} scale={1.3} userData={{ noMerge: true }}>
      <Model name="officeChair" rotation={[0, Math.PI, 0]} scale={1.05} />
      {/* legs, seated */}
      {[-0.13, 0.13].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.55, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 6, 12]} />
            <meshStandardMaterial color="#efece6" roughness={0.25} />
          </mesh>
          <mesh position={[x, 0.3, 0.4]} castShadow>
            <capsuleGeometry args={[0.06, 0.3, 6, 12]} />
            <meshStandardMaterial color={joint} />
          </mesh>
        </group>
      ))}
      {/* torso */}
      <Box radius={0.09} size={[0.46, 0.5, 0.32]} position={[0, 0.88, 0]} color={white.color} mat={white.mat} />
      <Box radius={0.04} size={[0.26, 0.2, 0.02]} position={[0, 0.9, 0.165]} color={joint} />
      <Cyl r={0.06} h={0.1} color={joint} position={[0, 1.17, 0]} />
      {/* head with the visor and pink ear rings */}
      <group ref={head} position={[0, 1.38, 0.02]}>
        <Box radius={0.15} size={[0.46, 0.38, 0.4]} color={white.color} mat={white.mat} />
        <Panel size={[0.34, 0.22]} map={robotFaceTexture()} lit position={[0, -0.01, 0.202]} />
        {[-0.24, 0.24].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.08, 0.018, 8, 24]} />
            <meshStandardMaterial color="#ff8fd0" {...pink} />
          </mesh>
        ))}
      </group>
      {/* arm resting towards the desk */}
      <group position={[0.3, 1.02, 0]}>
        <Ball r={0.075} color={joint} />
        <mesh position={[0.04, -0.17, 0.08]} rotation={[0.5, 0, 0.1]} castShadow>
          <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
          <meshStandardMaterial color="#efece6" roughness={0.25} />
        </mesh>
        <mesh position={[0.02, -0.26, 0.33]} rotation={[1.45, 0, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.22, 6, 12]} />
          <meshStandardMaterial color="#efece6" roughness={0.25} />
        </mesh>
        <Ball r={0.06} color={joint} position={[0.0, -0.27, 0.5]} />
      </group>
      {/* waving arm (pivot at the shoulder) */}
      <group position={[-0.3, 1.02, 0]}>
        <Ball r={0.075} color={joint} />
        <group ref={wave}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
            <meshStandardMaterial color="#efece6" roughness={0.25} />
          </mesh>
          <group position={[0, -0.34, 0]} rotation={[0, 0, -0.5]}>
            <Ball r={0.05} color={joint} />
            <mesh position={[0, -0.14, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
              <meshStandardMaterial color="#efece6" roughness={0.25} />
            </mesh>
            {/* open hand with four fingers and a thumb */}
            <group position={[0, -0.3, 0]}>
              <Box radius={0.02} size={[0.12, 0.09, 0.04]} color={joint} />
              {[-0.042, -0.014, 0.014, 0.042].map((x) => (
                <Box key={x} radius={0.008} size={[0.022, 0.09, 0.025]} position={[x, -0.085, 0]} color="#efece6" />
              ))}
              <Box radius={0.008} size={[0.022, 0.07, 0.025]} position={[0.075, -0.02, 0]} rotation={[0, 0, -0.7]} color="#efece6" />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function GreyArmchair(props) {
  const fabric = '#8e8b87'
  return (
    <group {...props}>
      <Hotspot id="contato" label="Contato" marker={[0, 1.35, 0]}>
        <Box radius={0.08} size={[1.0, 0.42, 0.95]} position={[0, 0.3, 0]} color={fabric} mat={{ roughness: 0.95 }} />
        <Box radius={0.08} size={[0.84, 0.16, 0.8]} position={[0, 0.56, 0.05]} color="#9a9792" mat={{ roughness: 0.95 }} />
        <Box radius={0.1} size={[1.0, 0.7, 0.24]} position={[0, 0.78, -0.38]} rotation={[-0.12, 0, 0]} color={fabric} mat={{ roughness: 0.95 }} />
        {[-0.46, 0.46].map((x) => (
          <Box key={x} radius={0.07} size={[0.16, 0.5, 0.9]} position={[x, 0.55, 0]} color={fabric} mat={{ roughness: 0.95 }} />
        ))}
        <Box radius={0.07} size={[0.5, 0.45, 0.16]} position={[0.12, 0.85, -0.2]} rotation={[-0.25, 0.25, 0.08]} color="#8c2a22" mat={{ roughness: 0.9 }} />
      </Hotspot>
    </group>
  )
}

// Day-only lights, dimmed away at night (the camera is in the boteco then).
function DayLights() {
  const spot = useRef()
  const fill = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const frames = useRef(0)
  useFrame(() => {
    const day = 1 - Math.min(1, timeState.t * 2)
    spot.current.intensity = lerp(0, 45, day)
    fill.current.intensity = lerp(0, 9, day)
    spot.current.shadow.autoUpdate = false
    if (frames.current++ < 10 || timeState.t !== timeState.target) spot.current.shadow.needsUpdate = true
  })
  return (
    <>
      <primitive object={target} position={[2.5, 0, 0.6]} />
      <spotLight
        ref={spot}
        position={[1.5, 3.2, -3.5]}
        target={target}
        angle={0.75}
        penumbra={0.6}
        decay={1.4}
        color="#ffa463"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <pointLight ref={fill} position={[3.5, 3.4, 3.0]} color="#ffcf9c" distance={11} />
    </>
  )
}

export function DayRoom() {
  return (
    <group position={DAY_ORIGIN}>
      <Merge>
        <Shell />
        <LeftWall />
        <SideboardDark />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.3, 0.008, 1.3]} receiveShadow>
          <planeGeometry args={[6.4, 4.8]} />
          <meshStandardMaterial map={rugTexture()} roughness={1} />
        </mesh>
      </Merge>
      <Window />
      <Board />
      <Desk />
      <Robot />
      <GreyArmchair position={[6.54, 0, 0.3]} rotation={[0, -1.25, 0]} />
      <Model name="beanbag" position={[0.4, 0, 1.78]} scale={1.25} />
      <Model name="plantWide" position={[3.95, 0, -2.3]} scale={1.05} />
      <DayLights />
    </group>
  )
}
