import { useState } from 'react'

export function GraphOptions({ showOutgoing, showIncoming, onToggleOutgoing, onToggleIncoming, vertical = false }) {
  const [open, setOpen] = useState(false)

  if (vertical) {
    return (
      <div className="accordion-panel">
        <button className="accordion-trigger" onClick={() => setOpen(o => !o)}>
          <span className="filter-label">EDGES</span>
          <span className="accordion-caret">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="accordion-body">
            <button
              className={`chip chip-outgoing ${showOutgoing ? 'on' : 'off'}`}
              onClick={onToggleOutgoing}
            >
              outgoing
            </button>
            <button
              className={`chip chip-incoming ${showIncoming ? 'on' : 'off'}`}
              onClick={onToggleIncoming}
            >
              incoming
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="graph-options">
      <span className="filter-label">EDGES</span>
      <button
        className={`chip chip-outgoing ${showOutgoing ? 'on' : 'off'}`}
        onClick={onToggleOutgoing}
      >
        outgoing
      </button>
      <button
        className={`chip chip-incoming ${showIncoming ? 'on' : 'off'}`}
        onClick={onToggleIncoming}
      >
        incoming
      </button>
    </div>
  )
}
