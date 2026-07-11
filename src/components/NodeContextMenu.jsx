import { useEffect, useRef } from 'react'

export function NodeContextMenu({ node, x, y, techStatus, onSetStatus, onClearStatus, onClose }) {
  const ref    = useRef(null)
  const status = techStatus?.get(node.id)?.status ?? 'untried'

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKey   = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown',   onKey)
    }
  }, [onClose])

  function handle(action) {
    action()
    onClose()
  }

  return (
    <div ref={ref} className="node-ctx-menu" style={{ left: x, top: y }}>
      <div className="node-ctx-title">{node.data.title}</div>
      <button
        className={`node-ctx-item node-ctx-item--success${status === 'succeeded' ? ' active' : ''}`}
        onClick={() => handle(() => status === 'succeeded' ? onClearStatus(node.id) : onSetStatus(node.id, 'succeeded'))}
      >
        ✓ Mark Succeeded
      </button>
      <button
        className={`node-ctx-item node-ctx-item--fail${status === 'tried-failed' ? ' active' : ''}`}
        onClick={() => handle(() => status === 'tried-failed' ? onClearStatus(node.id) : onSetStatus(node.id, 'tried-failed'))}
      >
        ✗ Mark Failed
      </button>
      {status !== 'untried' && (
        <button
          className="node-ctx-item node-ctx-item--clear"
          onClick={() => handle(() => onClearStatus(node.id))}
        >
          ↩ Clear Status
        </button>
      )}
    </div>
  )
}
