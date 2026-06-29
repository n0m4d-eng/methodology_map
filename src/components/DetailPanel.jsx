import { useState, useRef, useEffect, useCallback } from 'react'
import { marked } from 'marked'
import { parseFrontmatter } from '@/lib/parseFrontmatter'

marked.setOptions({ breaks: true })

export function DetailPanel({ node, width, onClose, onOpenWriteup, onResizeStart, onNavigateToNode }) {
  const d = node.data
  const [body, setBody] = useState(null) // null = loading, '' = no body

  // Fetch markdown body whenever the selected node changes
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

      {d.tools?.length > 0 && (
        <Section title="Commands / Tools">
          {d.tools.map((t, i) => (
            <div key={i} className="tool-line">
              <span className="tool-prompt">$</span> {t}
            </div>
          ))}
        </Section>
      )}

      {d.leads_to?.length > 0 && (
        <Section title={`Leads To (${d.leads_to.length})`}>
          {d.leads_to.map(id => (
            <div key={id} className="leads-item">→ {id}</div>
          ))}
        </Section>
      )}

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
