import React, { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import VIDEOS from 'virtual:football-videos'
import { getRadio, radioOff, radioOn } from '../../radio'

// A YouTube player laid exactly over the TV's screen. A cross-origin video can't be drawn into WebGL, so it is a real
// page element that three's camera transform keeps aligned with the panel.
// 820×500 px at 1 px = 0.001 scene units matches the 0.82×0.5 screen.
const PX = 1000
const DISTANCE_FACTOR = 400 / PX

let api = null
const loadApi = () =>
  (api ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  }))

const shuffled = (list) => [...list].sort(() => Math.random() - 0.5)
const CAZE_TRIES = 4

export function TvVideo({ size, position, focused }) {
  const slot = useRef()
  // hidden until a video really plays: YouTube's error screen never shows, and
  // the painted pitch stays on the TV if nothing can be played
  const [shown, setShown] = useState(false)
  const playerRef = useRef()
  const focusedRef = useRef(focused)
  focusedRef.current = focused

  // Silent in the background of the bar. Watching it (focus) turns its sound on
  // and rests the radio, which comes back afterwards.
  useEffect(() => {
    if (!focused) return
    playerRef.current?.unMute?.()
    const wasOn = ['playing', 'loading', 'blocked'].includes(getRadio().status) // the click itself may have just started it
    if (wasOn) radioOff()
    return () => {
      playerRef.current?.mute?.()
      if (wasOn) radioOn().catch(() => {})
    }
  }, [focused])

  useEffect(() => {
    if (!VIDEOS.caze.length && !VIDEOS.others.length) return
    let player
    let gone = false
    let queue = [...VIDEOS.caze.slice(0, CAZE_TRIES), ...shuffled(VIDEOS.others)]
    let current = queue.shift()
    let failures = 0
    const next = () => {
      if (++failures > CAZE_TRIES + 8) return
      if (!queue.length) queue = shuffled(VIDEOS.others)
      current = queue.shift()
      player?.loadVideoById(current)
    }
    loadApi().then((YT) => {
      if (gone) return
      player = new YT.Player(slot.current, {
        width: '100%',
        height: '100%',
        videoId: current,
        playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            playerRef.current = player
            if (focusedRef.current) player.unMute()
            player.playVideo()
          },
          // some videos can't be embedded or are blocked in the visitor's country
          onError: () => {
            setShown(false)
            next()
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              failures = 0
              setShown(true)
            } else if (e.data === YT.PlayerState.ENDED) next()
          },
        },
      })
    })
    return () => {
      gone = true
      playerRef.current = null
      player?.destroy?.()
    }
  }, [])

  // Until focused the clicks go through to the TV's hotspot in the scene.
  return (
    <Html transform position={position} distanceFactor={DISTANCE_FACTOR} zIndexRange={[5, 0]} pointerEvents={focused ? 'auto' : 'none'}>
      <div style={{ width: size[0] * PX, height: size[1] * PX, background: '#000', overflow: 'hidden', opacity: shown ? 1 : 0, pointerEvents: focused ? 'auto' : 'none' }}>
        <div ref={slot} />
      </div>
    </Html>
  )
}
