import React, { useEffect, useRef } from 'react'
import { BALL_COLORS, groupLabel, playerName } from './pool'
import { tr, useLang } from '../i18n'
import { usePool, restart } from './store'

// Scoreboard over the 3D table: players, groups, messages and the power meter.
// The table itself is played in the scene (Pool3D.jsx).
function BallsRow({ g, group }) {
  const ids = group === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]
  return (
    <span className="pool-balls">
      {ids.map((id) => {
        const potted = g.balls.find((b) => b.id === id).potted
        const style =
          id > 8
            ? { background: `linear-gradient(#f8f6ee 25%, ${BALL_COLORS[id]} 25% 75%, #f8f6ee 75%)` }
            : { background: BALL_COLORS[id] }
        return <i key={id} className={potted ? 'potted' : ''} style={style} />
      })}
    </span>
  )
}

export function PoolGame({ onExit }) {
  const { game: g, aim } = usePool()
  useLang()
  const aimRef = useRef(aim)
  aimRef.current = aim
  return (
    <div className="pool-overlay">
      <div className="pool-top">
        <button className="pool-back" onClick={onExit}>
          {tr('← Voltar ao boteco', '← Back to the boteco')}
        </button>
        <div className="pool-players">
          {[0, 1].map((i) => (
            <div key={i} className={`pool-player ${g.current === i && g.phase !== 'over' ? 'turn' : ''}`}>
              <strong>{i === 1 ? '🤖 ' : ''}{playerName(i)}</strong>
              <span>{g.groups[i] ? groupLabel(g.groups[i]) : tr('mesa aberta', 'open table')}</span>
              {g.groups[i] && <BallsRow g={g} group={g.groups[i]} />}
            </div>
          ))}
        </div>
        <button className="pool-restart" onClick={restart}>
          {tr('Nova partida', 'New game')}
        </button>
      </div>
      <div className="pool-bottom">
        <p className="pool-message">{g.message}</p>
        {g.phase === 'aim' && (
          <div className="pool-power" aria-label={tr('Força', 'Power')}>
            <PowerBar aim={aimRef} />
          </div>
        )}
        {g.phase === 'over' && (
          <button className="pool-restart big" onClick={restart}>
            {tr('Jogar de novo', 'Play again')}
          </button>
        )}
      </div>
    </div>
  )
}

// Live power meter, updated every frame without re-rendering the whole game.
function PowerBar({ aim }) {
  const bar = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      if (bar.current) bar.current.style.width = `${Math.round(aim.current.pull * 100)}%`
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [aim])
  return (
    <span className="pool-power-track">
      <span ref={bar} className="pool-power-fill" />
    </span>
  )
}

