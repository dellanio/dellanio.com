import React from 'react'
import { Box, Panel, Morph, Hotspot } from '../primitives'
import { LAYOUT } from '../layout'
import { chalkTexture } from '../textures'

// Same spot as the portfolio board: the menu of services, boteco style.
export function Chalkboard() {
  return (
    <Morph phase="night" delay={0.08} {...LAYOUT.chalkboard}>
      <Hotspot id="cardapio" label="Cardápio de serviços" marker={[0, 0.78, 0.15]}>
        {/* varnished wood frame around the slate, proportioned like the reference board */}
        <Box size={[1.5, 1.26, 0.03]} position={[0, 0, 0.015]} color="#5c3a1f" />
        <Panel size={[1.36, 1.13]} map={chalkTexture()} position={[0, 0, 0.032]} />
        {[
          [[1.5, 0.07, 0.05], [0, 0.595, 0.04]],
          [[1.5, 0.07, 0.05], [0, -0.595, 0.04]],
          [[0.07, 1.26, 0.05], [-0.715, 0, 0.04]],
          [[0.07, 1.26, 0.05], [0.715, 0, 0.04]],
        ].map(([size, position], i) => (
          <Box key={i} radius={0.008} size={size} position={position} color="#8a5a32" mat={{ roughness: 0.55 }} />
        ))}
      </Hotspot>
    </Morph>
  )
}
