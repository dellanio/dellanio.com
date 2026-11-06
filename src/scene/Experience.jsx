import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { Room, ROOM } from './Room'
import { Lighting } from './Lighting'
import { Effects } from './Effects'
import { SelectContext, QualityContext } from './primitives'
import { Objects } from './objects'
import { VIEWS } from '../content'
import { usePool } from '../game/store'
import { CAMERAS } from './layout'


// Must match the panel layout in styles.css.
const SHEET_BREAKPOINT = 640
const PANEL_WIDTH = 404 // 380px panel + 24px margin on the right
const SHEET_SHARE = 0.5 // bottom sheet covers about half the screen on phones
// from the foot of the table, under the lamp
const POOL_PORTRAIT = { pos: [0, 2.6, 2.6], target: [0, 0.78, -0.05] }

// Hotspot views are framed for landscape; on narrow screens pull the camera
// back along the same line so the whole object still fits the width.
function fitToAspect(view, aspect) {
  const pos = new THREE.Vector3(...view.pos)
  const target = new THREE.Vector3(...view.target)
  if (aspect < 1.2) pos.sub(target).multiplyScalar(Math.min(2.1, 1.2 / aspect)).add(target)
  pos.y = Math.min(pos.y, ROOM.height - 0.3) // backing off must not lift the camera through the ceiling
  return { pos, target }
}

// The scene the visitor isn't looking at is kept invisible, so the browser
// would only compile its shaders and upload its textures at the moment of the
// day/night switch: a freeze of several seconds. Once loading settles, show
// everything for one synchronous pass and prepare it all up front.
// The compile must target an off-screen render target: the post-processing
// composer renders the scene into one, and three.js builds a different shader
// variant for that (linear output, no tone mapping) than for the screen.
const TEXTURE_SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap']
function Warmup() {
  const { gl, scene, camera } = useThree()
  const { active } = useProgress()
  useEffect(() => {
    if (active) return
    const id = setTimeout(() => {
      const hidden = []
      scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o)
          o.visible = true
        }
      })
      const target = new THREE.WebGLRenderTarget(1, 1)
      const previous = gl.getRenderTarget()
      gl.setRenderTarget(target)
      if (gl.compileAsync) gl.compileAsync(scene, camera).catch(() => {})
      else gl.compile(scene, camera)
      gl.setRenderTarget(previous)
      target.dispose()
      scene.traverse((o) => {
        if (!o.material) return
        for (const m of [].concat(o.material)) for (const slot of TEXTURE_SLOTS) if (m[slot]?.image) gl.initTexture(m[slot])
      })
      hidden.forEach((o) => (o.visible = false))
    }, 600)
    return () => clearTimeout(id)
  }, [active, gl, scene, camera])
  return null
}

export function Experience({ selected, onSelect, low, mode }) {
  const controls = useRef()
  // while a match is on, pointer drags aim the cue instead of orbiting the camera
  const { playing } = usePool()
  // (not `enabled = false`: that would also freeze the flight to the table)
  useEffect(() => {
    const c = controls.current
    const saved = { left: c.mouseButtons.left, wheel: c.mouseButtons.wheel, one: c.touches.one, two: c.touches.two }
    if (!playing) return
    c.mouseButtons.left = c.mouseButtons.wheel = c.touches.one = c.touches.two = 0
    return () => {
      c.mouseButtons.left = saved.left
      c.mouseButtons.wheel = saved.wheel
      c.touches.one = saved.one
      c.touches.two = saved.two
    }
  }, [playing])
  const { size, camera } = useThree()
  const aspect = size.width / size.height
  // each scene has the camera of its reference picture; narrow screens back off along it
  const home = CAMERAS[mode]
  const fov = aspect < 1.2 ? Math.min(70, home.fov * (1.2 / Math.max(aspect, 0.45)) ** 0.55) : home.fov
  useFrame((_, delta) => {
    if (Math.abs(camera.fov - fov) < 0.01) return
    camera.fov += (fov - camera.fov) * Math.min(1, delta * 3)
    camera.updateProjectionMatrix()
  })

  useEffect(() => {
    const c = controls.current
    c.mouseButtons.right = 0 // no panning: visitors can't get lost
    c.touches.two = 0b10000000000 // pinch zooms only (ACTION.TOUCH_DOLLY): no two-finger panning out of the room
    c.touches.three = 0
  }, [])

  const mounted = useRef(false)
  useEffect(() => {
    // on portrait screens the pool table is played end-on, so it stands up and fills the screen
    const portraitPool = selected === 'sinuca' && aspect < 0.8
    const view = portraitPool ? POOL_PORTRAIT : selected && VIEWS[selected]
    // with the side panel open, only the area left of it frames the object
    const sheet = size.width <= SHEET_BREAKPOINT
    const freeAspect = sheet || selected === 'sinuca' ? aspect : (size.width - PANEL_WIDTH) / size.height
    const { pos, target } = fitToAspect(view || home, portraitPool ? 99 : view ? freeAspect : aspect < 0.7 ? aspect * 1.4 : 99)
    const c = controls.current
    const animate = mounted.current
    // Keep visitors inside the room: they can look around a little and zoom in,
    // but never back out far enough to see the open sides of the set.
    const offset = pos.clone().sub(target)
    const dist = offset.length()
    const azimuth = Math.atan2(offset.x, offset.z)
    const polar = Math.acos(offset.y / dist)
    c.maxDistance = dist * 1.03
    c.minDistance = Math.min(1.2, dist * 0.5)
    c.minAzimuthAngle = azimuth - 0.32
    c.maxAzimuthAngle = azimuth + 0.32
    c.minPolarAngle = Math.max(0.2, polar - 0.22)
    c.maxPolarAngle = Math.min(1.62, polar + 0.18)
    c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, animate)

    // Slide the object out from under the info panel: up on phones, left on desktop.
    let ox = 0
    let oy = 0
    if (view && selected !== 'sinuca') {
      const viewH = 2 * pos.distanceTo(target) * Math.tan(THREE.MathUtils.degToRad(fov / 2))
      // camera-controls focal offset: +y lifts the object, +x pushes it left
      if (sheet) oy = viewH * (SHEET_SHARE / 2)
      else ox = viewH * aspect * (PANEL_WIDTH / 2 / size.width)
    }
    c.setFocalOffset(ox, oy, 0, animate)
    mounted.current = true
  }, [selected, home, aspect, size.width, fov])

  const ctx = useMemo(() => ({ select: onSelect }), [onSelect])

  return (
    <QualityContext.Provider value={low}>
      <SelectContext.Provider value={ctx}>
        <CameraControls
          ref={controls}
          smoothTime={0.6}
        />
        <Warmup />
        <Lighting low={low} />
        <Room />
        <Objects tvOn={mode === 'night'} tvFocused={selected === 'tv'} />
        <Effects low={low} />
      </SelectContext.Provider>
    </QualityContext.Provider>
  )
}
