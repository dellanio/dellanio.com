import React, { useContext, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Morph, QualityContext } from '../primitives'
import { WINDOW } from '../Room'
import { SUN_SPOT } from '../Lighting'

// Soft volumetric look: brightest where the shaft is seen face-on, fading to
// nothing at its silhouette (so no hard edges give the geometry away), along
// its length, and broken into faint dusty streaks.
const beamShader = {
  uniforms: { color: { value: new THREE.Color('#ffe2a8') }, opacity: { value: 0.16 }, time: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vView = normalize(cameraPosition - world.xyz);
      gl_Position = projectionMatrix * viewMatrix * world;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform float opacity;
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec2 vUv;
    void main() {
      float facing = pow(abs(dot(normalize(vNormal), normalize(vView))), 2.2);
      float along = smoothstep(0.0, 0.25, vUv.y) * (0.35 + 0.65 * vUv.y);
      float streaks = 0.65 + 0.35 * sin(vUv.x * 61.0 + sin(vUv.x * 13.0) * 2.0 + time * 0.15);
      gl_FragColor = vec4(color * opacity * facing * along * streaks, 1.0);
    }`,
}

// Visible morning light shaft from the window to the floor, with floating dust.
export function Sunbeam() {
  const { geometry, position, quaternion, mid } = useMemo(() => {
    const from = new THREE.Vector3((WINDOW.x0 + WINDOW.x1) / 2, (WINDOW.y0 + WINDOW.y1) / 2, -4.45)
    const to = new THREE.Vector3(SUN_SPOT[0], 0.02, SUN_SPOT[2])
    const dir = to.clone().sub(from)
    const len = dir.length()
    // round, many-sided tube squashed to the window's proportions: no corners to catch the eye
    const geo = new THREE.CylinderGeometry(0.85, 1.25, len, 48, 1, true)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize())
    return {
      geometry: geo,
      position: from.clone().add(to).multiplyScalar(0.5),
      quaternion: q,
      mid: from.clone().lerp(to, 0.45),
    }
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...beamShader,
        uniforms: THREE.UniformsUtils.clone(beamShader.uniforms),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useFrame((state) => (material.uniforms.time.value = state.clock.elapsedTime))
  const low = useContext(QualityContext)

  return (
    <Morph phase="day" delay={0.0}>
      <mesh geometry={geometry} material={material} position={position} quaternion={quaternion} scale={[1, 1, 0.5]} renderOrder={2} userData={{ noMerge: true }} />
      <Sparkles position={mid} count={low ? 30 : 70} scale={[2.2, 2.2, 3.2]} size={2.2} speed={0.25} opacity={0.6} color="#fff1cf" noise={0.6} />
    </Morph>
  )
}
