import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { parseFrontmatter } from '@/lib/parseFrontmatter'

marked.setOptions({ breaks: true })

const DIFF_COLOR = {
  easy:   'var(--success)',
  medium: 'var(--warning)',
  hard:   'var(--danger)',
  insane: 'var(--purple)',
}

export function WriteupPanel({ writeup, onClose, onNavigateToNode }) {
  const [body, setBody] = useState(null)

  useEffect(() => {
    if (!writeup?.filePath) { setBody(''); return }
    setBody(null)
    fetch(`/content/${writeup.filePath}`)
      .then(r => r.text())
      .then(md => {
        const rawBody = parseFrontmatter(md).body
        // Rewrite relative image paths to absolute /content/... paths
        const dir = writeup.filePath.substring(0, writeup.filePath.lastIndexOf('/') + 1)
        const processed = rawBody.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/|\/)(.*?)\)/g,
          (_, alt, src) => `![${alt}](/content/${dir}${src})`
        )
        setBody(processed)
      })
      .catch(() => setBody(''))
  }, [writeup?.id])

  if (!writeup) return null

  const bodyHtml  = body ? marked.parse(body) : ''
  const diffColor = DIFF_COLOR[writeup.difficulty?.toLowerCase()] ?? 'var(--text-dim)'

  return (
    <div className="writeup-full-page">
      <div className="writeup-full-inner">

        {/* Header */}
        <div className="writeup-panel-head">
          <div style={{ flex: 1 }}>
            <div className="detail-stage">{writeup.platform}</div>
            <div className="detail-title">{writeup.title}</div>
            <div className="writeup-panel-meta">
              {writeup.os && <span className="wp-os">{writeup.os}</span>}
              {writeup.difficulty && (
                <span className="wp-diff" style={{ color: diffColor }}>
                  {writeup.difficulty}
                </span>
              )}
              {writeup.date && <span className="wp-date">{writeup.date}</span>}
            </div>
          </div>
          <button className="detail-close wp-back" onClick={onClose}>← back</button>
        </div>

        {/* Summary */}
        {writeup.summary && (
          <div className="writeup-panel-section">
            <div className="wu-summary">{writeup.summary}</div>
          </div>
        )}

        {/* Key techniques */}
        {writeup.key_techniques?.length > 0 && (
          <div className="writeup-panel-section">
            <div className="detail-section-title">Key Techniques</div>
            <div className="key-techniques-list">
              {writeup.key_techniques.map((t, i) => (
                <div key={i} className="key-technique-item">
                  <span className="key-tech-bullet">◆</span> {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {writeup.tags?.length > 0 && (
          <div className="writeup-panel-section">
            <div className="detail-section-title">Tags</div>
            <div className="node-tags" style={{ gap: '5px' }}>
              {writeup.tags.map(t => (
                <span key={t} className={`ntag ntag-${t}`}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Attack Path */}
        {writeup.attack_path?.length > 0 && (
          <div className="writeup-panel-section">
            <div className="detail-section-title">Attack Path ({writeup.attack_path.length} steps)</div>
            <div className="attack-path-list">
              {writeup.attack_path.map((step, i) => (
                <div
                  key={step}
                  className="attack-path-step attack-path-step-link"
                  onClick={() => { onNavigateToNode?.(step); onClose() }}
                  title={`View ${step} on methodology map`}
                >
                  <span className="attack-step-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="attack-step-name">{step}</span>
                  <span className="attack-step-goto">↗</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full writeup body */}
        <div className="writeup-panel-section writeup-panel-body">
          <div className="detail-section-title">Writeup</div>
          {body === null ? (
            <div className="body-loading">loading...</div>
          ) : bodyHtml ? (
            <div
              className="body-html"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <div className="body-loading">no writeup body</div>
          )}
        </div>

      </div>
    </div>
  )
}
