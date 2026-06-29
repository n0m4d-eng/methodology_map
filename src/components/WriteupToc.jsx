export function WriteupToc({ headings, activeId, onSelect }) {
  if (!headings.length) return null
  return (
    <nav className="toc-sidebar">
      <div className="toc-label">ON THIS PAGE</div>
      {headings.map(({ level, text, id }, i) => (
        <button
          key={i}
          className={`toc-item toc-h${level} ${activeId === id ? 'toc-active' : ''}`}
          onClick={() => onSelect(id)}
        >
          {text}
        </button>
      ))}
    </nav>
  )
}
