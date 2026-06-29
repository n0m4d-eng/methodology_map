import { useState, useRef, useEffect } from 'react'

const NAV_ITEMS = [
  { id: 'about',    label: 'About Me' },
  { id: 'map',      label: 'Methodology Map' },
  { id: 'writeups', label: 'Writeups' },
]

export function NavDropdown({ currentPage, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div className="nav-dropdown" ref={ref}>
      <button className="nav-trigger" onClick={() => setOpen(o => !o)}>
        {NAV_ITEMS.find(i => i.id === currentPage)?.label.toUpperCase() ?? 'METHODOLOGY MAP'}
        <span className="nav-caret">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="nav-menu">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'nav-item-active' : ''}`}
              onClick={() => { onNavigate(item.id); setOpen(false) }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
