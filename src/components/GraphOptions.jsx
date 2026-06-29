export function GraphOptions({ showOutgoing, showIncoming, onToggleOutgoing, onToggleIncoming }) {
  return (
    <div className="graph-options">
      <span className="filter-label">EDGES</span>
      <button
        className={`chip chip-outgoing ${showOutgoing ? 'on' : 'off'}`}
        onClick={onToggleOutgoing}
      >
        outgoing
      </button>
      <button
        className={`chip chip-incoming ${showIncoming ? 'on' : 'off'}`}
        onClick={onToggleIncoming}
      >
        incoming
      </button>
    </div>
  )
}
