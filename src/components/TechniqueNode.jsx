import { Handle, Position } from '@xyflow/react'

export function TechniqueNode({ data, selected }) {
  const techStatus = data.techStatus ?? 'untried'

  const cls = [
    'technique-node',
    selected                          ? 'selected'        : '',
    techStatus === 'succeeded'        ? 'node-succeeded'  : '',
    techStatus === 'tried-failed'     ? 'node-failed'     : '',
  ].filter(Boolean).join(' ')

  const style = {
    width: 260,
    opacity: data.dimmed ? 0.15 : 1,
    pointerEvents: data.dimmed ? 'none' : 'auto',
  }

  return (
    <div className={cls} style={style}>
      <Handle type="target" position={Position.Left}  id="in"  />
      <Handle type="source" position={Position.Right} id="out" />

      <div className="node-title">
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
