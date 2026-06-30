import { useState, useRef, useEffect } from 'react'

const NAV_ITEMS = [
  { id: 'about',    label: 'About Me' },
  { id: 'map',      label: 'Methodology Map' },
  { id: 'writeups', label: 'Writeups' },
]

export function NavDropdown({ currentPage, onNavigate }) {
  const [open,       setOpen]       = useState(false)
  const [focusIndex, setFocusIndex] = useState(-1)
  const ref = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setFocusIndex(-1)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function select(id) {
    onNavigate(id)
    setOpen(false)
    setFocusIndex(-1)
  }

  function handleTriggerKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setFocusIndex(i => Math.min(i + 1, NAV_ITEMS.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (open) setFocusIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open && focusIndex >= 0) {
        select(NAV_ITEMS[focusIndex].id)
      } else {
        setOpen(o => !o)
        setFocusIndex(0)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusIndex(-1)
    }
  }

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        className="nav-trigger"
        onClick={() => { const next = !open; setOpen(next); setFocusIndex(next ? 0 : -1) }}
        onKeyDown={handleTriggerKeyDown}
      >
        {NAV_ITEMS.find(i => i.id === currentPage)?.label.toUpperCase() ?? 'METHODOLOGY MAP'}
        <span className="nav-caret">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="nav-menu">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'nav-item-active' : ''} ${focusIndex === i ? 'nav-item-focused' : ''}`}
              onClick={() => select(item.id)}
              onMouseEnter={() => setFocusIndex(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
