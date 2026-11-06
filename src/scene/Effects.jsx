import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, N8AO, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { timeState, lerp } from './state'

// Ambient occlusion grounds the objects; bloom only picks up emissive values
// above 1 (lamps, fridge, fluorescent tube), so it mostly shows at night.
// Low quality drops AO and MSAA, the two most expensive passes.
export function Effects({ low }) {
  const bloom = useRef()
  const vignette = useRef()
  useFrame(() => {
    const t = timeState.t
    // by day only a whisper: sunlit wood must not glow
    if (bloom.current) bloom.current.intensity = lerp(0.08, 0.85, t)
    if (vignette.current) vignette.current.darkness = lerp(0.45, 0.75, t)
  })
  const tail = [
    <Bloom key="bloom" ref={bloom} mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.35} />,
    <ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />,
    <Vignette key="vignette" ref={vignette} offset={0.25} darkness={0.45} />,
  ]
  // Separate trees: EffectComposer doesn't handle children toggling in place.
  return low ? (
    <EffectComposer key="low" multisampling={0} enableNormalPass={false}>
      {tail}
    </EffectComposer>
  ) : (
    <EffectComposer key="high" multisampling={4} enableNormalPass={false}>
      <N8AO aoRadius={0.6} distanceFalloff={0.8} intensity={2.2} halfRes quality="medium" />
      {tail}
    </EffectComposer>
  )
}
