import React from 'react'
import { Box, Panel, Morph, Hotspot } from '../primitives'
import { LAYOUT } from '../layout'
import { portfolioTexture } from '../textures'

// Hangs on the back wall where the boteco's chalkboard menu goes at night.

export function PortfolioBoard() {
  return (
    <Morph phase="day" delay={0.08} {...LAYOUT.portfolio}>
      <Hotspot id="portfolio" label="Portfólio" marker={[0, 0.85, 0.15]}>
        <Box radius={0.02} size={[2.56, 1.32, 0.06]} position={[0, 0, 0.03]} color="#6b4a2b" />
        <Panel size={[2.42, 1.2]} map={portfolioTexture()} position={[0, 0, 0.062]} />
        {/* warm picture light above */}
        <Box size={[1.2, 0.05, 0.08]} position={[0, 0.74, 0.16]} color="#2a2a2a" />
        <Box size={[0.04, 0.04, 0.14]} position={[0, 0.72, 0.09]} color="#2a2a2a" />
      </Hotspot>
    </Morph>
  )
}
