export const MAP_CHIPS = [
  { id: 'windows', label: 'windows' },
  { id: 'linux',   label: 'linux' },
  { id: 'ad',      label: 'active directory' },
  { id: 'recon',   label: 'recon' },
  { id: 'misc',    label: 'miscellaneous' },
]

export const WRITEUP_CHIPS = [
  { id: 'htb',          label: 'HTB' },
  { id: 'oscp',         label: 'OSCP' },
  { id: 'hack-smarter', label: 'Hack Smarter' },
]

export function FilterBar({ chips, active, onToggle, className = '' }) {
  return (
    <div className={`filter-bar-float${className ? ` ${className}` : ''}`}>
      <span className="filter-label">FILTER</span>
      {chips.map(({ id, label }) => (
        <button
          key={id}
          className={`chip chip-${id} ${active.has(id) ? 'on' : 'off'}`}
          onClick={() => onToggle(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
