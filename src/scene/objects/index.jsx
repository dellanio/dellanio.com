import React from 'react'
import { Morph } from '../primitives'
import { LAYOUT } from '../layout'
import { Model } from '../Model'
import { Desk, DeskLampOnDesk, DeskMacMini, OfficeChair, Rug } from './Desk'
import { DeskFlags } from './Flags'
import { PortfolioBoard } from './PortfolioBoard'
import { Sideboard } from './Sideboard'
import { Bookshelf } from './Bookshelf'
import { RetroFridge } from './RetroFridge'
import { WallFan, Calendar, Pegboard, DaySign } from './LeftWall'
import { Lounge, Plant, HangingPlant, PlantShelf, PendantLamp } from './Lounge'
import { PoolTable, PoolLamp } from './PoolTable'
import { Chalkboard } from './Chalkboard'
import { BarCounter, BottleShelf, BeerFridge, Crates } from './Bar'
import { Tv, CueRack, NightSign, NightPoster, PlasticTables, FluorescentTube } from './NightWall'
import { Sunbeam } from './Sunbeam'
import { WalkingCockatiel } from './Cockatiel'
import { Dog } from './Dog'

// Every object of the room lives in its own file and is registered here.
// Day and night objects share a footprint so one morphs into the other.
export function Objects({ tvOn, tvFocused }) {
  return (
    <group>
      {/* both: fixtures that never change */}
      <WallFan />
      <Calendar />

      {/* day-only greenery (the boteco photo has just the plant on the bottle shelf) */}
      <Morph phase="day" delay={0.06} {...LAYOUT.plantBig}>
        <Model name="plantTall" scale={1.35} fallback={<Plant scale={1.2} />} />
      </Morph>
      <Morph phase="day" delay={0.08} {...LAYOUT.plantSmall}>
        <Model name="plantWide" scale={0.7} fallback={<Plant scale={0.7} leaves={7} />} />
      </Morph>
      <Morph phase="day" delay={0.1} {...LAYOUT.hangingPlant}>
        <HangingPlant />
      </Morph>
      <Morph phase="day" delay={0.1} {...LAYOUT.plantShelf}>
        <PlantShelf />
      </Morph>
      <Morph phase="day" delay={0.12} {...LAYOUT.pendant}>
        <PendantLamp />
      </Morph>

      {/* day: office · night: boteco (paired in place) */}
      <Rug />
      <Sunbeam />
      <Desk />
      <DeskLampOnDesk />
      <DeskMacMini />
      <DeskFlags />
      <WalkingCockatiel />
      <OfficeChair />
      <PortfolioBoard />
      <Sideboard />
      <Bookshelf />
      <RetroFridge />
      <Pegboard />
      <DaySign />
      <Lounge />
      <PoolTable />
      <PoolLamp />
      <Chalkboard />
      <BarCounter />
      <BottleShelf />
      <BeerFridge />
      <Tv on={tvOn} focused={tvFocused} />
      <CueRack />
      <NightSign />
      <NightPoster />
      <PlasticTables />
      <Crates />
      <FluorescentTube />
      <Dog />
    </group>
  )
}
