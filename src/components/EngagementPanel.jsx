import { useState } from 'react'

const SERVICE_GROUPS = [
  { label: 'Remote Access',   services: ['ssh', 'rdp', 'winrm', 'vnc', 'telnet'] },
  { label: 'File Sharing',    services: ['smb', 'ftp', 'nfs', 'rsync', 'tftp', 'webdav'] },
  { label: 'Web',             services: ['web', 'elasticsearch'] },
  { label: 'Mail',            services: ['smtp', 'pop3', 'imap'] },
  { label: 'Database',        services: ['mssql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'redis'] },
  { label: 'Network',         services: ['dns', 'snmp', 'ntp', 'ipmi'] },
  { label: 'Directory/Auth',  services: ['ldap', 'ad-dc', 'kerberos', 'adcs'] },
  { label: 'Container/Cloud', services: ['docker', 'kubernetes'] },
]

export function EngagementPanel({
  discovered,
  discoveredArray,
  addService,
  removeService,
  clearSession,
  isActive,
  suggestedNext = [],
  attemptedNodes = [],
  onSelectNode,
}) {
  const [open, setOpen] = useState(false)

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

          {attemptedNodes.length > 0 && (
            <div className="ep-section ep-section--attempted">
              <div className="ep-section-label">ATTEMPTED</div>
              <div className="ep-attempt-list">
                {attemptedNodes.map(n => (
                  <button
                    key={n.id}
                    className={`ep-attempt-row ep-attempt-row--${n.status === 'succeeded' ? 'success' : 'fail'}`}
                    onClick={() => { onSelectNode?.(n.id); setOpen(false) }}
                  >
                    <span className="ep-attempt-icon">{n.status === 'succeeded' ? '✓' : '✗'}</span>
                    <span className="ep-attempt-stage">{n.stage}</span>
                    <span className="ep-attempt-name">{n.title}</span>
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
                    return (
                      <button
                        key={svc}
                        className={`ep-svc-chip${isDisc ? ' ep-svc-chip--discovered' : ''}`}
                        onClick={() => isDisc ? removeService(svc) : addService(svc)}
                        title={svc}
                      >
                        {svc}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

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
