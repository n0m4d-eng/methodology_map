import { useState } from 'react'

const SERVICE_GROUPS = [
  { label: 'Remote Access',   services: ['ssh', 'rdp', 'winrm', 'vnc', 'telnet'] },
  { label: 'File Sharing',    services: ['smb', 'ftp', 'nfs', 'rsync', 'tftp', 'webdav'] },
  { label: 'Web',             services: ['web', 'elasticsearch'] },
  { label: 'Mail',            services: ['smtp', 'pop3', 'imap'] },
  { label: 'Database',        services: ['mssql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'redis'] },
  { label: 'Network',         services: ['dns', 'snmp', 'ntp'] },
  { label: 'Directory/Auth',  services: ['ldap', 'ad-dc', 'kerberos', 'adcs'] },
  { label: 'Container/Cloud', services: ['docker', 'kubernetes'] },
]

export function EngagementPanel({
  discovered,
  dismissed,
  discoveredArray,
  addService,
  removeService,
  dismissService,
  undismissService,
  clearSession,
  isActive,
  suggestedNext = [],
  onSelectNode,
}) {
  const [open,          setOpen]          = useState(false)
  const [dismissTarget, setDismissTarget] = useState(null)
  const [dismissNote,   setDismissNote]   = useState('')

  function handleDismissSubmit(svc) {
    dismissService(svc, dismissNote.trim())
    setDismissTarget(null)
    setDismissNote('')
  }

  function handleDismissCancel() {
    setDismissTarget(null)
    setDismissNote('')
  }

  return (
    <div className="engagement-widget">
      <button
        className={`engagement-toggle${isActive ? ' engagement-toggle--active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle engagement session panel"
      >
        <span className="engagement-toggle-icon">⚡</span>
        <span className="engagement-toggle-label">SESSION</span>
        {isActive && (
          <span className="engagement-toggle-badge">{discoveredArray.length}</span>
        )}
      </button>

      {open && (
        <div className="engagement-panel">
          <div className="ep-header">
            <span className="ep-title">LIVE SESSION</span>
            <button className="ep-close" onClick={() => setOpen(false)}>×</button>
          </div>

          {suggestedNext.length > 0 && (
            <div className="ep-section ep-section--suggested">
              <div className="ep-section-label">SUGGESTED NEXT</div>
              <div className="ep-suggest-list">
                {suggestedNext.map(node => (
                  <button
                    key={node.id}
                    className="ep-suggest-chip"
                    onClick={() => { onSelectNode?.(node.id); setOpen(false) }}
                  >
                    <span className="ep-suggest-stage">{node.stage}</span>
                    <span className="ep-suggest-name">{node.title}</span>
                    <span className="ep-suggest-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ep-section">
            <div className="ep-section-label">DISCOVERED SERVICES</div>
            {SERVICE_GROUPS.map(({ label, services }) => (
              <div key={label} className="ep-group">
                <div className="ep-group-label">{label}</div>
                <div className="ep-chips">
                  {services.map(svc => {
                    const isDisc = discovered.has(svc)
                    const isDism = dismissed.has(svc)
                    return (
                      <button
                        key={svc}
                        className={[
                          'ep-svc-chip',
                          isDisc ? 'ep-svc-chip--discovered' : '',
                          isDism ? 'ep-svc-chip--dismissed'  : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => isDisc ? removeService(svc) : addService(svc)}
                        title={isDism ? `Dismissed: ${dismissed.get(svc) || '(no note)'}` : svc}
                      >
                        {svc}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {discoveredArray.length > 0 && (
            <div className="ep-section">
              <div className="ep-section-label">SERVICE STATUS</div>
              <div className="ep-service-list">
                {discoveredArray.map(svc => {
                  const isDism = dismissed.has(svc)
                  const note   = dismissed.get(svc)

                  if (dismissTarget === svc) {
                    return (
                      <div key={svc} className="ep-service-row ep-service-row--noting">
                        <span className="ep-svc-name">{svc}</span>
                        <input
                          className="ep-dismiss-input"
                          placeholder="note (optional)"
                          value={dismissNote}
                          onChange={e => setDismissNote(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  handleDismissSubmit(svc)
                            if (e.key === 'Escape') handleDismissCancel()
                          }}
                          autoFocus
                        />
                        <button className="ep-btn ep-btn--confirm" onClick={() => handleDismissSubmit(svc)}>✓</button>
                        <button className="ep-btn ep-btn--cancel"  onClick={handleDismissCancel}>×</button>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={svc}
                      className={`ep-service-row${isDism ? ' ep-service-row--dismissed' : ''}`}
                    >
                      <span className="ep-svc-name">{svc}</span>
                      {isDism && note && (
                        <span className="ep-svc-note" title={note}>{note}</span>
                      )}
                      <div className="ep-svc-actions">
                        {isDism ? (
                          <button
                            className="ep-btn ep-btn--undo"
                            onClick={() => undismissService(svc)}
                            title="Undo dismiss"
                          >undo</button>
                        ) : (
                          <button
                            className="ep-btn ep-btn--dismiss"
                            onClick={() => { setDismissTarget(svc); setDismissNote('') }}
                            title="Mark as dismissed"
                          >dismiss</button>
                        )}
                        <button
                          className="ep-btn ep-btn--remove"
                          onClick={() => removeService(svc)}
                          title="Remove from session"
                        >✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="ep-footer">
            <button
              className="ep-btn ep-btn--clear"
              onClick={() => { clearSession(); setOpen(false) }}
              disabled={discoveredArray.length === 0}
            >
              RESET SESSION
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
