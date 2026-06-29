import { Handle, Position } from '@xyflow/react'

export function TechniqueNode({ data, selected }) {
  const cls = [
    'technique-node',
    selected ? 'selected' : '',
  ].filter(Boolean).join(' ')

  const dimStyle = data.dimmed
    ? { width: 210, opacity: 0.15, pointerEvents: 'none' }
    : { width: 210 }

  return (
    <div className={cls} style={dimStyle}>
      <Handle type="target" position={Position.Left}  id="in"  />
      <Handle type="source" position={Position.Right} id="out" />

      <div className="node-title">{data.title}</div>

      <div className="node-tags">
        {(data.tags ?? []).map(tag => (
          <span key={tag} className={`ntag ntag-${tag}`}>{tag}</span>
        ))}
      </div>
    </div>
  )
}
