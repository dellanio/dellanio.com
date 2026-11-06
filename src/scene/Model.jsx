import React, { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// GLB assets exported from Blender (Draco-compressed, decoder served locally).
export const DRACO = '/draco/'
export const MODELS = {
  armchair: '/models/armchair.glb',
  sideTable: '/models/side_table.glb',
  plantTall: '/models/plant_tall.glb',
  plantWide: '/models/plant_wide.glb',
  succulent: '/models/succulent.glb',
  tvCrt: '/models/tv_crt.glb',
  desk: '/models/desk.glb',
  officeChair: '/models/office_chair.glb',
  poolTable: '/models/pool_table.glb',
  jars: '/models/jars.glb',
  espresso: '/models/espresso.glb',
  deskLamp: '/models/desk_lamp.glb',
  pothos: '/models/pothos.glb',
  cockatiel: '/models/cockatiel.glb',
  dog: '/models/dog.glb',
  sideboard: '/models/sideboard.glb',
  retroFridge: '/models/retro_fridge.glb',
  beanbag: '/models/beanbag.glb',
  barCounter: '/models/bar_counter.glb',
  beerFridge: '/models/beer_fridge.glb',
  plasticChair: '/models/plastic_chair.glb',
  plasticTable: '/models/plastic_table.glb',
  bookshelf: '/models/bookshelf.glb',
  bottleShelf: '/models/bottle_shelf.glb',
  snackCase: '/models/snack_case.glb',
  cueRack: '/models/cue_rack.glb',
  wallFan: '/models/wall_fan.glb',
}

// `screens` maps a material name in the GLB to a texture shown unlit (monitor, TV).
// `materials` maps a material name to properties assigned on a copy of it.
// `meshes` maps a material name to a function that gets the cloned mesh (to
// reshape its geometry, say).
function Gltf({ url, screens, materials, meshes, ...props }) {
  const { scene } = useGLTF(url, DRACO)
  const object = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if (!o.isMesh) return
      const screen = screens?.[o.material.name]
      if (screen) {
        const map = screen.clone()
        map.flipY = false // glTF UV convention
        map.needsUpdate = true
        screen.addEventListener('repaint', () => (map.needsUpdate = true))
        o.material = new THREE.MeshBasicMaterial({ map, toneMapped: false })
        return
      }
      meshes?.[o.material.name]?.(o)
      const override = materials?.[o.material.name]
      if (override) o.material = Object.assign(o.material.clone(), override)
      o.castShadow = true
      o.receiveShadow = true
      // foliage cards: alpha-test instead of blending so they sort and shadow correctly
      if (o.material.transparent && o.material.map) {
        o.material.transparent = false
        o.material.alphaTest = 0.5
      } else if (o.material.transparent) {
        // glass and brine: see the contents through, cast no shadow
        o.material.depthWrite = false
        o.castShadow = false
      }
    })
    return clone
  }, [scene, screens, materials, meshes])
  return <primitive object={object} {...props} />
}

// Real model with the procedural version as placeholder while it loads.
// Kept out of <Merge> so the placeholder never gets baked in and left behind.
export function Model({ name, fallback = null, ...props }) {
  return (
    <group userData={{ noMerge: true }}>
      <Suspense fallback={fallback}>
        <Gltf url={MODELS[name]} {...props} />
      </Suspense>
    </group>
  )
}

// Only what the two rooms actually show is fetched up front.
const PRELOAD = ['plantTall', 'plantWide', 'succulent', 'officeChair', 'poolTable', 'barCounter', 'beerFridge',
  'plasticChair', 'plasticTable', 'bottleShelf', 'snackCase', 'cueRack', 'wallFan', 'jars', 'espresso', 'deskLamp', 'pothos', 'cockatiel', 'dog']
PRELOAD.forEach((name) => useGLTF.preload(MODELS[name], DRACO))
