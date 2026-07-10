import { useState, useEffect, useRef, useMemo } from 'react'
import { marked } from 'marked'
import { parseFrontmatter } from '@/lib/parseFrontmatter'
import { WriteupToc } from '@/components/WriteupToc'

const DIFF_COLOR = {
  easy:   'var(--success)',
  medium: 'var(--warning)',
  hard:   'var(--danger)',
  insane: 'var(--purple)',
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

marked.setOptions({ breaks: true })

function injectHeadingIds(html) {
  const seen = {}
  return html.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    const plain = inner.replace(/<[^>]*>/g, '')
    let id = slugify(plain)
    seen[id] = (seen[id] ?? 0) + 1
    if (seen[id] > 1) id = `${id}-${seen[id]}`
    return `<h${level} id="${id}">${inner}</h${level}>`
  })
}

export function WriteupPanel({ writeup, onClose, onNavigateToNode }) {
  const [body,     setBody]     = useState(null)
  const [activeId, setActiveId] = useState('')
  const [tocOpen,  setTocOpen]  = useState(false)
  const bodyRef   = useRef(null)
  const tocBtnRef = useRef(null)
  const tocPopRef = useRef(null)

  useEffect(() => {
    if (!writeup?.filePath || writeup.tags?.includes('active')) { setBody(''); return }
    setBody(null)
    setActiveId('')
    fetch(`/content/${writeup.filePath}`)
      .then(r => r.text())
      .then(md => {
        const rawBody = parseFrontmatter(md).body
        const normalised = rawBody.replace(/\.images\//g, 'images/')
        const dir = writeup.filePath.substring(0, writeup.filePath.lastIndexOf('/') + 1)
        const processed = normalised.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/|\/)(.*?)\)/g,
          (_, alt, src) => `![${alt}](/content/${dir}${src})`
        )
        setBody(processed)
      })
      .catch(() => setBody(''))
  }, [writeup?.id])

  const headings = useMemo(() => {
    if (!body) return []
    const seen = {}
    return body.split('\n').reduce((acc, line) => {
      const m = line.match(/^(#{1,3})\s+(.+)/)
      if (m) {
        const text = m[2].trim()
        let id = slugify(text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ''))
        seen[id] = (seen[id] ?? 0) + 1
        if (seen[id] > 1) id = `${id}-${seen[id]}`
        acc.push({ level: m[1].length, text, id })
      }
      return acc
    }, [])
  }, [body])

  // Close TOC popover when clicking outside
  useEffect(() => {
    if (!tocOpen) return
    function onOutside(e) {
      if (
        tocPopRef.current && !tocPopRef.current.contains(e.target) &&
        tocBtnRef.current && !tocBtnRef.current.contains(e.target)
      ) setTocOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [tocOpen])

  useEffect(() => {
    if (!bodyRef.current || !headings.length) return
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id)
        }
      },
      { rootMargin: '-8% 0px -80% 0px', threshold: 0 }
    )
    bodyRef.current.querySelectorAll('h1, h2, h3').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [body, headings.length])

  if (!writeup) return null

  const bodyHtml  = body ? injectHeadingIds(marked.parse(body)) : ''
  const diffColor = DIFF_COLOR[writeup.difficulty?.toLowerCase()] ?? 'var(--text-dim)'

  if (writeup.tags?.includes('active')) {
    return (
      <div className="writeup-full-page">
        <div className="writeup-full-inner">
          <div className="writeup-panel-head">
            <div style={{ flex: 1 }}>
              <div className="detail-stage">{writeup.platform}</div>
              <div className="detail-title">{writeup.title}</div>
              <div className="writeup-panel-meta">
                {writeup.os && <span className="wp-os">{writeup.os}</span>}
                {writeup.difficulty && (
                  <span className="wp-diff" style={{ color: diffColor }}>{writeup.difficulty}</span>
                )}
              </div>
            </div>
            <button className="detail-close wp-back" onClick={onClose}>← back</button>
          </div>
          <div className="writeup-locked-body">
            <div className="writeup-locked-icon">🔒</div>
            <div className="writeup-locked-title">Machine Active</div>
            <div className="writeup-locked-msg">
              This machine is currently live on HackTheBox. The writeup will be published after retirement.
            </div>
          </div>
        </div>
      </div>
    )
  }

  function handleTocSelect(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="writeup-full-page">
      <WriteupToc headings={headings} activeId={activeId} onSelect={handleTocSelect} />

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
          {headings.length > 0 && (
            <button
              ref={tocBtnRef}
              className="toc-toggle-btn"
              onClick={() => setTocOpen(o => !o)}
              aria-label="Toggle table of contents"
            >
              ≡ Sections
            </button>
          )}
          <button className="detail-close wp-back" onClick={onClose}>← back</button>
        </div>

        {/* TOC popover — shown when button is tapped on sub-1300px screens */}
        {tocOpen && (
          <div className="toc-popover" ref={tocPopRef}>
            <WriteupToc
              headings={headings}
              activeId={activeId}
              onSelect={(id) => { handleTocSelect(id); setTocOpen(false) }}
            />
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
                  onClick={() => { onClose(); onNavigateToNode?.(step) }}
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
              ref={bodyRef}
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
