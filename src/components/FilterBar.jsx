import { useState } from 'react'

export const MAP_CHIPS = [
  { id: 'windows', label: 'windows' },
  { id: 'linux',   label: 'linux' },
  { id: 'ad',      label: 'active directory' },
  { id: 'recon',   label: 'recon' },
  { id: 'misc',    label: 'miscellaneous' },
]

export const WRITEUP_CHIPS = [
  { id: 'htb',          label: 'HTB' },
  { id: 'oscp',         label: 'OSCP' },
  { id: 'hack-smarter', label: 'Hack Smarter' },
]

export function FilterBar({ chips, active, onToggle, className = '', vertical = false }) {
  const [open, setOpen] = useState(false)

  if (vertical) {
    return (
      <div className="accordion-panel">
        <button className="accordion-trigger" onClick={() => setOpen(o => !o)}>
          <span className="filter-label">FILTER</span>
          <span className="accordion-caret">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="accordion-body">
            {chips.map(({ id, label }) => (
              <button
                key={id}
                className={`chip chip-${id} ${active.has(id) ? 'on' : 'off'}`}
                onClick={() => onToggle(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`filter-bar-float${className ? ` ${className}` : ''}`}>
      <span className="filter-label">FILTER</span>
      {chips.map(({ id, label }) => (
        <button
          key={id}
          className={`chip chip-${id} ${active.has(id) ? 'on' : 'off'}`}
          onClick={() => onToggle(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
