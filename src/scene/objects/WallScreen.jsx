import React from 'react'
import { Box, Panel, Morph } from '../primitives'
import { LAYOUT } from '../layout'
import { dashboardTexture } from '../textures'

// Slim wall display above the fridge; the boteco's old TV hangs here at night.
export function WallScreen() {
  return (
    <Morph phase="day" delay={0.06} {...LAYOUT.screen}>
      <Box radius={0.012} size={[1.12, 0.67, 0.04]} position={[0, 0, 0.02]} color="#151515" mat={{ roughness: 0.4 }} />
      <Panel size={[1.06, 0.61]} map={dashboardTexture()} lit position={[0, 0, 0.042]} />
    </Morph>
  )
}
