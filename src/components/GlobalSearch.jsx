import { useState, useRef, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'

export function GlobalSearch({ nodes, writeups, onSelectNode, onSelectWriteup }) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  const corpus = useMemo(() => [
    ...nodes.map(n => ({
      type:     'node',
      id:       n.id,
      title:    n.title,
      subtitle: n.stage,
      tags:     (n.tags ?? []).join(' '),
      _raw:     n,
    })),
    ...writeups.map(w => ({
      type:     'writeup',
      id:       w.id,
      title:    w.title,
      subtitle: w.platform,
      tags:     (w.tags ?? []).join(' '),
      _raw:     w,
    })),
  ], [nodes, writeups])

  const fuse = useMemo(() => new Fuse(corpus, {
    keys: [
      { name: 'title',    weight: 0.6 },
      { name: 'tags',     weight: 0.25 },
      { name: 'subtitle', weight: 0.15 },
    ],
    threshold: 0.4,
    includeScore: true,
  }), [corpus])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return fuse.search(q, { limit: 12 })
  }, [fuse, query])

  const nodeResults    = results.filter(r => r.item.type === 'node')
  const writeupResults = results.filter(r => r.item.type === 'writeup')

  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleSelect(item) {
    setQuery('')
    setOpen(false)
    if (item.type === 'node')    onSelectNode(item.id)
    if (item.type === 'writeup') onSelectWriteup(item._raw)
  }

  const showDropdown = open && results.length > 0

  return (
    <div className="global-search" ref={containerRef}>
      <input
        ref={inputRef}
        className="nav-search"
        type="text"
        placeholder="/ search..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { if (query) setOpen(true) }}
      />

      {showDropdown && (
        <div className="search-dropdown">
          {nodeResults.length > 0 && (
            <div className="search-group">
              <div className="search-group-label">Nodes</div>
              {nodeResults.map(({ item }) => (
                <button key={item.id} className="search-result" onClick={() => handleSelect(item)}>
                  <span className="search-result-title">{item.title}</span>
                  <span className="search-result-meta">{item.subtitle}</span>
                </button>
              ))}
            </div>
          )}
          {writeupResults.length > 0 && (
            <div className="search-group">
              <div className="search-group-label">Writeups</div>
              {writeupResults.map(({ item }) => (
                <button key={item.id} className="search-result" onClick={() => handleSelect(item)}>
                  <span className="search-result-title">{item.title}</span>
                  <span className="search-result-meta">{item.subtitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
