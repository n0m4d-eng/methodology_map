import { useState, useRef, useEffect, useCallback } from 'react'
import { marked } from 'marked'
import { parseFrontmatter } from '@/lib/parseFrontmatter'

marked.setOptions({ breaks: true })

export function DetailPanel({ node, width, onClose, onOpenWriteup, onResizeStart, onNavigateToNode, onSetStatus, onClearStatus, currentStatus = 'untried', sheet = false }) {
  const d = node.data
  const [body,          setBody]          = useState(null)
  const [activeTab,     setActiveTab]     = useState('notes')
  const [leadsToOpen,   setLeadsToOpen]   = useState(true)

  // Reset tabs and accordion whenever the selected node changes
  useEffect(() => { setActiveTab('notes'); setLeadsToOpen(true) }, [node.id])

  useEffect(() => {
    if (!d.filePath) { setBody(''); return }
    setBody(null)
    fetch(`/content/${d.filePath}`)
      .then(r => r.text())
      .then(md => setBody(parseFrontmatter(md).body))
      .catch(() => setBody(''))
  }, [node.id])

  const bodyHtml = body ? marked.parse(body) : ''
  const bodyRef  = useRef(null)

  // Post-process rendered markdown: find table cells with "→ node-id" and mark them clickable
  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.querySelectorAll('td').forEach(td => {
      const text = td.textContent.trim()
      if (!text.includes('→')) return
      const afterArrow = text.replace(/.*→\s*/, '').trim()
      const nodeId = afterArrow.split(/[\s(]/)[0]
      if (nodeId) {
        td.classList.add('body-node-link')
        td.dataset.nodeId = nodeId
      }
    })
  }, [bodyHtml])

  const handleBodyClick = useCallback((e) => {
    const td = e.target.closest('td.body-node-link')
    if (!td || !onNavigateToNode) return
    onNavigateToNode(td.dataset.nodeId)
  }, [onNavigateToNode])

  // ── Sheet mode (tablet / mobile) ───────────────────────────────────────────
  if (sheet) {
    return (
      <div className="detail-panel-sheet">
        <div className="drag-pip-wrap">
          <div className="drag-pip" />
        </div>

        <div className="detail-head">
          <div>
            <div className="detail-stage">{d.stage}</div>
            <div className="detail-title">{d.title}</div>
          </div>
          <button className="detail-close" onClick={onClose}>×</button>
        </div>

        <div className="sheet-tabs">
          <button className={`stab${activeTab === 'notes' ? ' stab-active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
          <button className={`stab${activeTab === 'links' ? ' stab-active' : ''}`} onClick={() => setActiveTab('links')}>Links</button>
        </div>

        <div className="sheet-body">
          {activeTab === 'links' && (
            <div className="sheet-links">
              {d.references?.length > 0 && (
                <div className="sheet-group">
                  <div className="detail-section-title">References</div>
                  {d.references.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="ref-link">
                      ↗ {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  ))}
                </div>
              )}
              {d.relatedWriteups?.length > 0 && (
                <div className="sheet-group">
                  <div className="detail-section-title">Writeups ({d.relatedWriteups.length})</div>
                  <div className="writeup-card-list">
                    {d.relatedWriteups.map(w => (
                      <div key={w.id} className="writeup-card writeup-card-clickable" onClick={() => onOpenWriteup?.(w)}>
                        <div className="writeup-title">{w.title}</div>
                        <div className="writeup-meta">
                          <span className="writeup-plat">{w.platform}</span>
                          <span className="writeup-diff">{w.difficulty}</span>
                        </div>
                        <div className="writeup-path">{w.attack_path.join(' → ')}</div>
                        <div className="writeup-card-cta">view writeup →</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!d.references?.length && !d.relatedWriteups?.length && (
                <div className="body-loading">no links</div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            body === null ? (
              <div className="body-loading">loading...</div>
            ) : (
              <>
                {bodyHtml ? (
                  <div
                    ref={bodyRef}
                    className="body-html"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    onClick={handleBodyClick}
                  />
                ) : (
                  <div className="body-loading">no notes</div>
                )}
                {d.leads_to?.length > 0 && (
                  <LeadsToAccordion
                    ids={d.leads_to}
                    open={leadsToOpen}
                    onToggle={() => setLeadsToOpen(o => !o)}
                    onNavigate={onNavigateToNode}
                  />
                )}
              </>
            )
          )}
        </div>
        <NodeStatusBar status={currentStatus} onSetStatus={s => onSetStatus?.(node.id, s)} onClear={() => onClearStatus?.(node.id)} />
      </div>
    )
  }

  // ── Desktop panel ───────────────────────────────────────────────────────────
  return (
    <div className="detail-panel" style={{ width, minWidth: width }}>
      {/* Drag handle — grab to resize panel width */}
      <div className="detail-resize-handle" onMouseDown={onResizeStart} />

      <div className="detail-head">
        <div>
          <div className="detail-stage">{d.stage}</div>
          <div className="detail-title">{d.title}</div>
        </div>
        <button className="detail-close" onClick={onClose}>×</button>
      </div>

      {d.references?.length > 0 && (
        <Section title="References">
          {d.references.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="ref-link">
              ↗ {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          ))}
        </Section>
      )}

      {d.relatedWriteups?.length > 0 && (
        <Section title={`Writeups (${d.relatedWriteups.length})`}>
          <div className="writeup-card-list">
            {d.relatedWriteups.map(w => (
              <div
                key={w.id}
                className="writeup-card writeup-card-clickable"
                onClick={() => onOpenWriteup?.(w)}
              >
                <div className="writeup-title">{w.title}</div>
                <div className="writeup-meta">
                  <span className="writeup-plat">{w.platform}</span>
                  <span className="writeup-diff">{w.difficulty}</span>
                </div>
                <div className="writeup-path">{w.attack_path.join(' → ')}</div>
                <div className="writeup-card-cta">view writeup →</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Notes">
        {body === null ? (
          <div className="body-loading">loading...</div>
        ) : bodyHtml ? (
          <div
            ref={bodyRef}
            className="body-html"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
            onClick={handleBodyClick}
          />
        ) : (
          <div className="body-loading">no notes</div>
        )}
      </Section>

      {d.leads_to?.length > 0 && (
        <LeadsToAccordion
          ids={d.leads_to}
          open={leadsToOpen}
          onToggle={() => setLeadsToOpen(o => !o)}
          onNavigate={onNavigateToNode}
        />
      )}
      <NodeStatusBar status={currentStatus} onSetStatus={s => onSetStatus?.(node.id, s)} onClear={() => onClearStatus?.(node.id)} />
    </div>
  )
}

function NodeStatusBar({ status, onSetStatus, onClear }) {
  return (
    <div className="detail-status-bar">
      <button
        className={`dsb-btn dsb-btn--success${status === 'succeeded' ? ' dsb-btn--active' : ''}`}
        onClick={() => status === 'succeeded' ? onClear() : onSetStatus('succeeded')}
      >✓ Succeeded</button>
      <button
        className={`dsb-btn dsb-btn--fail${status === 'tried-failed' ? ' dsb-btn--active' : ''}`}
        onClick={() => status === 'tried-failed' ? onClear() : onSetStatus('tried-failed')}
      >✗ Failed</button>
      {status !== 'untried' && (
        <button className="dsb-btn dsb-btn--clear" onClick={onClear}>↩</button>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">{title}</div>
      {children}
    </div>
  )
}

function LeadsToAccordion({ ids, open, onToggle, onNavigate }) {
  return (
    <div className="leads-to-accordion">
      <button className="leads-to-accordion-header" onClick={onToggle}>
        <span>LEADS TO ({ids.length})</span>
        <span className={`leads-to-chevron${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="leads-to-accordion-body">
          {ids.map(id => (
            <div key={id} className="leads-item leads-item-link" onClick={() => onNavigate?.(id)}>→ {id}</div>
          ))}
        </div>
      )}
    </div>
  )
}
