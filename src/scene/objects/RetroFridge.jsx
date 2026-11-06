import React from 'react'
import { Model } from '../Model'
import { Box, Morph } from '../primitives'
import { LAYOUT } from '../layout'

const MINT = '#9ed9c0'

// Rounded-shoulder retro fridge; the boteco's red beer fridge takes its place at night.
export function RetroFridge() {
  return (
    <Morph phase="day" delay={0.02} {...LAYOUT.retroFridge}>
      <Model name="retroFridge" fallback={<Box radius={0.05} size={[0.7, 1.52, 0.6]} position={[0, 0.84, 0]} color={MINT} />} />
    </Morph>
  )
}
