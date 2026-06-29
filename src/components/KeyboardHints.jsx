const SHORTCUTS = [
  { key: '/',     desc: 'focus search'     },
  { key: '↑ ↓',  desc: 'move in column'   },
  { key: '← →',  desc: 'prev / next stage' },
  { key: 'Enter', desc: 'open node'        },
  { key: 'Esc',   desc: 'close panel'      },
  { key: '?',     desc: 'toggle shortcuts' },
]

export function KeyboardHints({ open, onToggle }) {
  return (
    <div className="kb-hints">
      {open ? (
        <div className="kb-hints-open">
          <div className="kb-hints-header">
            <span className="kb-hints-title">SHORTCUTS</span>
            <button className="kb-close-btn" onClick={onToggle}>×</button>
          </div>
          <div className="kb-hints-list">
            {SHORTCUTS.map(({ key, desc }) => (
              <div key={key} className="kb-hint-row">
                <kbd className="kb-key">{key}</kbd>
                <span className="kb-desc">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button className="kb-badge" onClick={onToggle}>?</button>
      )}
    </div>
  )
}
