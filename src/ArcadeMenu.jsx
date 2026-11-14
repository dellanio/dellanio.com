import React, { useEffect, useRef, useState } from 'react'
import { UI } from './content'
import { useLang } from './i18n'
import { getRadio, radioOff, radioOn } from './radio'

// The arcade's game menu, over the scene once the camera faces the cabinet:
// SNES and PS1 tabs, a grid of covers that loads more as you scroll, and the
// chosen game in an iframe (public/arcade/play.html runs EmulatorJS). Only
// homebrew whose authors allow hosting is listed: public/arcade/games.json
// keeps each one's author, licence and source.
const SYSTEMS = [
  { id: 'snes', label: 'SNES' },
  { id: 'psx', label: 'PS1' },
]
const PAGE = 12

export function ArcadeMenu({ onExit }) {
  const ui = UI[useLang()].arcade
  const [games, setGames] = useState(null)
  const [system, setSystem] = useState('snes')
  const [shown, setShown] = useState(PAGE)
  const [game, setGame] = useState(null)
  const sentinel = useRef()

  useEffect(() => {
    fetch('/arcade/games.json')
      .then((r) => (r.ok ? r.json() : []))
      .then(setGames)
      .catch(() => setGames([]))
  }, [])

  // games have their own sound: the radio rests while the arcade is open
  useEffect(() => {
    const wasOn = ['playing', 'loading', 'blocked'].includes(getRadio().status)
    if (wasOn) radioOff()
    return () => {
      if (wasOn) radioOn().catch(() => {})
    }
  }, [])

  // Esc: from a game back to the list, from the list back to the bar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      if (game) setGame(null)
      else onExit()
    }
    addEventListener('keydown', onKey, true)
    return () => removeEventListener('keydown', onKey, true)
  }, [game, onExit])

  const list = (games ?? []).filter((g) => g.system === system)

  // infinite scroll: one more page whenever the end of the grid comes into view
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((n) => n + PAGE), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [system, games, game])

  const pick = (id) => {
    setSystem(id)
    setShown(PAGE)
  }

  return (
    <div className="arcade-overlay" role="dialog" aria-label={ui.title}>
      <header className="arcade-top">
        {game ? (
          <button className="arcade-btn" onClick={() => setGame(null)}>
            {ui.back}
          </button>
        ) : (
          <button className="arcade-btn" onClick={onExit}>
            {ui.exit}
          </button>
        )}
        <h2>{game ? game.title : ui.title}</h2>
        {!game && (
          <div className="arcade-tabs" role="tablist">
            {SYSTEMS.map((s) => (
              <button key={s.id} role="tab" aria-selected={system === s.id} className={system === s.id ? 'on' : ''} onClick={() => pick(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {game ? (
        <div className="arcade-play">
          <iframe
            title={game.title}
            src={`/arcade/play.html?system=${game.system}&rom=${encodeURIComponent(game.rom)}`}
            allow="autoplay; fullscreen; gamepad"
            allowFullScreen
          />
          <p className="arcade-credit">
            {game.title} · {ui.by} {game.author}
            {game.year ? ` (${game.year})` : ''} · {ui.license}{' '}
            <a href={game.license_url} target="_blank" rel="noreferrer">
              {game.license}
            </a>{' '}
            ·{' '}
            <a href={game.source_url} target="_blank" rel="noreferrer">
              {ui.source}
            </a>
          </p>
        </div>
      ) : (
        <div className="arcade-list">
          {games === null ? (
            <p className="arcade-msg">{ui.loading}</p>
          ) : list.length === 0 ? (
            <p className="arcade-msg">{ui.empty}</p>
          ) : (
            <ul className="arcade-grid">
              {list.slice(0, shown).map((g) => (
                <li key={g.id}>
                  <button onClick={() => setGame(g)}>
                    {g.cover ? <img src={g.cover} alt="" loading="lazy" /> : <span className="arcade-nocover">{g.title}</span>}
                    <strong>{g.title}</strong>
                    <small>{g.author}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {shown < list.length && <div ref={sentinel} className="arcade-more" />}
          <p className="arcade-note">{ui.note}</p>
        </div>
      )}
    </div>
  )
}
