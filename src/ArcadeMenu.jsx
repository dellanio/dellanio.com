import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { UI } from './content'
import { useLang } from './i18n'
import { getRadio, radioOff, radioOn } from './radio'

// Embed only the selected OldGames player, keeping our own navigation.
const SYSTEMS = [{ id: 'snes', label: 'SNES' }, { id: 'psx', label: 'PS1' }]
const PAGE = 24
const searchText = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function validGame(game) {
  if (!game || typeof game.id !== 'string' || typeof game.title !== 'string' || !SYSTEMS.some((s) => s.id === game.system)) return false
  try {
    const player = new URL(game.player_url)
    const source = new URL(game.source_url)
    return player.origin === 'https://oldgames.app' && player.pathname === '/emulator' &&
      source.origin === 'https://oldgames.app' && source.pathname.startsWith('/games/')
  } catch { return false }
}

function Cover({ game }) {
  const [failed, setFailed] = useState(false)
  return game.cover && !failed
    ? <img src={game.cover} alt="" loading="lazy" onError={() => setFailed(true)} />
    : <span className="arcade-nocover">{game.title}</span>
}

function Player({ game, ui }) {
  const area = useRef()
  const [frameSize, setFrameSize] = useState({ width: '100%', height: '100%' })
  const [started, setStarted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useLayoutEffect(() => {
    // OldGames uses a 4:3 screen plus a toolbar (and touch controls on mobile).
    // Fit the entire component in the available space, including its controls.
    const mobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 2)
    const controls = mobile ? (game.system === 'psx' ? 400 : 300) : 60
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = area.current
      const fitted = Math.min(width, Math.max(160, (height - controls) * 4 / 3))
      setFrameSize({ width: Math.floor(fitted), height: Math.ceil(fitted * 3 / 4 + controls) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area.current)
    return () => observer.disconnect()
  }, [game.system])
  useEffect(() => {
    if (!started || loaded) return
    const id = setTimeout(() => setSlow(true), 25_000)
    return () => clearTimeout(id)
  }, [started, loaded, attempt])
  const retry = () => { setLoaded(false); setSlow(false); setAttempt((n) => n + 1) }
  return (
    <div className="arcade-play">
      <div ref={area} className="arcade-player">
        {started ? <>
          <iframe key={attempt} title={game.title} style={frameSize} src={game.player_url} allow="autoplay; fullscreen; gamepad" allowFullScreen onLoad={(e) => { setLoaded(true); e.currentTarget.focus() }} onError={() => setSlow(true)} />
          {!loaded && <p className="arcade-player-status" role="status">{ui.opening}</p>}
        </> : (
          <div className="arcade-start">
            <Cover game={game} />
            <button className="arcade-btn arcade-start-btn" onClick={() => setStarted(true)} autoFocus><span aria-hidden="true">▶</span> {ui.play}</button>
          </div>
        )}
      </div>
      {slow && !loaded && <p className="arcade-credit" role="status">{ui.slow} <button className="arcade-btn" onClick={retry}>{ui.retry}</button></p>}
    </div>
  )
}

export function ArcadeMenu({ onExit }) {
  const ui = UI[useLang()].arcade
  const [games, setGames] = useState(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [system, setSystem] = useState('snes')
  const [shown, setShown] = useState(PAGE)
  const [query, setQuery] = useState('')
  const [game, setGame] = useState(null)
  const sentinel = useRef()
  const listRef = useRef()
  const scrollTop = useRef(0)
  const selectedId = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    setGames(null)
    fetch('/arcade/games.json', { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`Catalog: ${r.status}`); return r.json() })
      .then((data) => {
        if (!Array.isArray(data) || !data.every(validGame)) throw new Error('Invalid arcade catalog')
        setGames(data)
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [reload])

  useEffect(() => {
    const wasOn = ['playing', 'loading', 'blocked'].includes(getRadio().status)
    if (wasOn) radioOff()
    return () => { if (wasOn) radioOn().catch(() => {}) }
  }, [])

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

  const list = useMemo(() => {
    const search = searchText(query.trim())
    return (games ?? []).filter((g) => g.system === system && searchText(g.title).includes(search))
  }, [games, system, query])

  useEffect(() => {
    const el = sentinel.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setShown((n) => Math.min(n + PAGE, list.length))
    }, { root: listRef.current, rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [list, shown, game])

  useLayoutEffect(() => {
    if (game || !listRef.current) return
    listRef.current.scrollTop = scrollTop.current
    if (selectedId.current) document.getElementById(`arcade-${selectedId.current}`)?.focus({ preventScroll: true })
  }, [game])

  const resetList = () => {
    setShown(PAGE)
    scrollTop.current = 0
    selectedId.current = null
    if (listRef.current) listRef.current.scrollTop = 0
  }
  const pick = (id) => { setSystem(id); setQuery(''); resetList() }
  const play = (chosen) => {
    scrollTop.current = listRef.current?.scrollTop ?? 0
    selectedId.current = chosen.id
    setGame(chosen)
  }

  return (
    <div className="arcade-overlay" role="dialog" aria-modal="true" aria-label={ui.title}>
      <header className="arcade-top">
        <button className="arcade-btn" onClick={() => game ? setGame(null) : onExit()}>{game ? ui.back : ui.exit}</button>
        <h2>{game ? game.title : ui.title}</h2>
        {!game && <div className="arcade-tabs" role="group" aria-label={ui.systems}>
          {SYSTEMS.map((s) => <button key={s.id} aria-pressed={system === s.id} className={system === s.id ? 'on' : ''} onClick={() => pick(s.id)}>{s.label}</button>)}
        </div>}
      </header>
      {game ? <Player key={game.id} game={game} ui={ui} /> : <>
        <div className="arcade-search">
          <input type="search" aria-label={ui.search} placeholder={ui.search} value={query} onChange={(e) => { setQuery(e.target.value); resetList() }} />
          {games && <span role="status">{list.length} {list.length === 1 ? ui.game : ui.games}</span>}
        </div>
        <div ref={listRef} className="arcade-list">
          {error ? <p className="arcade-msg" role="alert">{ui.error} <button className="arcade-btn" onClick={() => setReload((n) => n + 1)}>{ui.retry}</button></p>
            : games === null ? <p className="arcade-msg" role="status">{ui.loading}</p>
              : list.length === 0 ? <p className="arcade-msg">{query ? ui.noResults : ui.empty}</p>
                : <ul className="arcade-grid">
                  {list.slice(0, shown).map((g) => <li key={g.id}>
                    <button id={`arcade-${g.id}`} onClick={() => play(g)}>
                      <Cover game={g} /><strong>{g.title}</strong><small>{system === 'snes' ? 'SNES' : 'PS1'}</small>
                    </button>
                  </li>)}
                </ul>}
          {shown < list.length && <div ref={sentinel} className="arcade-more"><button className="arcade-btn" onClick={() => setShown((n) => n + PAGE)}>{ui.more}</button></div>}
          {system === 'psx' && <p className="arcade-note">{ui.ps1Note}</p>}
        </div>
      </>}
    </div>
  )
}
