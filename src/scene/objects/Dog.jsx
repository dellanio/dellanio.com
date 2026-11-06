import React, { Suspense, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { MODELS, DRACO } from '../Model'
import { Morph } from '../primitives'
import { LAYOUT } from '../layout'

// The boteco's caramelo (Meshy model from the reference photo), fast asleep by
// the bar. A "breath" shape key made in Blender swells his ribs slowly.
function SleepingDog() {
  const { scene } = useGLTF(MODELS.dog, DRACO)
  const { root, chest } = useMemo(() => {
    const root = scene.clone(true)
    let chest = null
    root.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = o.receiveShadow = true
      if (o.morphTargetInfluences?.length) chest = o
    })
    return { root, chest }
  }, [scene])
  useFrame((state) => {
    if (!chest) return
    // ~14 breaths a minute, with a short pause after each exhale
    const t = (state.clock.elapsedTime * 0.23) % 1
    chest.morphTargetInfluences[0] = t < 0.45 ? Math.sin((t / 0.45) * Math.PI * 0.5) : t < 0.8 ? Math.cos(((t - 0.45) / 0.35) * Math.PI * 0.5) : 0
  })
  return <primitive object={root} />
}

export function Dog() {
  return (
    <Morph phase="night" delay={0.14} {...LAYOUT.dog}>
      <group userData={{ noMerge: true }}>
        <Suspense fallback={null}>
          <SleepingDog />
        </Suspense>
      </group>
    </Morph>
  )
}
