import React from 'react'
import { CONTENT, NAV, UI } from './content'
import { useLang } from './i18n'
import { useRadio, toggleRadio, setRadioVolume } from './radio'

export function Hud({ mode, selected, onSelect, onToggle }) {
  // the pool table opens the game instead of a text panel
  const lang = useLang()
  const ui = UI[lang]
  const panel = selected && selected !== 'sinuca' && CONTENT[lang][selected]
  return (
    <div className={`hud ${mode}`}>
      <div className="brand">dellanio.com</div>

      {mode === 'night' && <RadioControl ui={ui.radio} />}

      <button className="toggle" onClick={onToggle} aria-label={ui.toggle}>
        <span className={mode === 'day' ? 'on' : ''}>☀️ {ui.office}</span>
        <span className={mode === 'night' ? 'on' : ''}>🍺 {ui.bar}</span>
      </button>

      <nav className="nav">
        {NAV[lang][mode].map((item) => (
          <button
            key={item.id}
            className={selected === item.id ? 'active' : ''}
            onClick={() => onSelect(selected === item.id ? null : item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {panel && (
        <aside className="panel" key={`${selected}-${lang}`}>
          <button className="close" onClick={() => onSelect(null)} aria-label={ui.close}>
            ×
          </button>
          <p className="kicker">{panel.kicker}</p>
          <h2>{panel.title}</h2>
          {panel.body.map((block, i) =>
            typeof block === 'string' ? (
              <p key={i}>{block}</p>
            ) : (
              <ul key={i}>
                {block.map((li, j) => (
                  <li key={j}>
                    {typeof li === 'string' ? (
                      li
                    ) : (
                      <a href={li.href} target="_blank" rel="noreferrer">
                        {li.text}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ),
          )}
        </aside>
      )}
    </div>
  )
}

// The boteco radio: on/off and volume, top left while in the boteco.
function RadioControl({ ui }) {
  const { status, volume } = useRadio()
  const on = status === 'playing' || status === 'loading'
  return (
    <div className={`radio ${status}`} role="group" aria-label={ui.label}>
      <button className="radio-power" onClick={toggleRadio} aria-pressed={on} aria-label={on ? ui.on : ui.off} title={on ? ui.on : ui.off}>
        <span aria-hidden="true">{on ? '📻' : '🔇'}</span>
      </button>
      <span className="radio-info">
        <strong>Fay Só Forró</strong>
        <small aria-live="polite">{ui.status[status]}</small>
      </span>
      <input
        className="radio-volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => setRadioVolume(Number(e.target.value))}
        aria-label={ui.volume}
        aria-valuetext={`${Math.round(volume * 100)}%`}
      />
    </div>
  )
}
