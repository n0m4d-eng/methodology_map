import { Handle, Position } from '@xyflow/react'

export function TechniqueNode({ id, data, selected }) {
  const isDismissed = data.dismissed === true
  const techStatus  = data.techStatus ?? 'untried'

  const cls = [
    'technique-node',
    selected                          ? 'selected'        : '',
    isDismissed                       ? 'dismissed'       : '',
    techStatus === 'succeeded'        ? 'node-succeeded'  : '',
    techStatus === 'tried-failed'     ? 'node-failed'     : '',
  ].filter(Boolean).join(' ')

  const style = {
    width: 260,
    opacity: data.dimmed ? 0.15 : isDismissed ? 0.45 : 1,
    pointerEvents: data.dimmed ? 'none' : 'auto',
  }

  function handleStatusChange(e) {
    const value = e.target.value
    if (value === 'untried') data.onClearStatus?.(id)
    else data.onSetStatus?.(id, value)
  }

  return (
    <div className={cls} style={style}>
      <Handle type="target" position={Position.Left}  id="in"  />
      <Handle type="source" position={Position.Right} id="out" />

      {data.sessionActive && (
        <select
          className={`node-status-select node-status-select--${techStatus}`}
          value={techStatus}
          onChange={handleStatusChange}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <option value="untried">status —</option>
          <option value="tried-failed">dead end</option>
          <option value="succeeded">it works</option>
        </select>
      )}

      <div className="node-title">
        {isDismissed && <span className="node-dismissed-mark" aria-hidden="true">✗ </span>}
        {data.title}
      </div>

      <div className="node-tags">
        {(data.tags ?? []).map(tag => (
          <span key={tag} className={`ntag ntag-${tag}`}>{tag}</span>
        ))}
      </div>
    </div>
  )
}
