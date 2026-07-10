import { useState, useEffect, useMemo } from 'react'
import { WriteupPanel }             from './WriteupPanel'
import { FilterBar, WRITEUP_CHIPS } from './FilterBar'
import { useMediaQuery }            from '@/hooks/useMediaQuery'

function matchesPlatform(writeup, platformId) {
  const p = (writeup.platform ?? '').toLowerCase()
  if (platformId === 'htb')          return p.includes('hackthebox') || p.includes('htb')
  if (platformId === 'oscp')         return p.includes('oscp') || p.includes('proving grounds') || p.includes('offsec')
  if (platformId === 'hack-smarter') return p.includes('hack smarter')
  return false
}

const DIFF_CLASS = {
  easy:   'diff-easy',
  medium: 'diff-medium',
  hard:   'diff-hard',
  insane: 'diff-insane',
}

const PLATFORM_LABEL = {
  'htb':          'HackTheBox',
  'oscp':         'OSCP',
  'hack-smarter': 'Hack Smarter',
}

export function WriteupsPage({ writeups, initialWriteup = null, onNavigateToNode, onSelect }) {
  const [selected,       setSelected]       = useState(initialWriteup)
  const [activePlatform, setActivePlatform] = useState('htb')
  const activePlatformSet = useMemo(() => new Set([activePlatform]), [activePlatform])
  const isCompact = useMediaQuery('(max-width: 1100px)')

  useEffect(() => {
    if (initialWriteup) setSelected(initialWriteup)
  }, [initialWriteup])

  function pick(w) {
    setSelected(w)
    onSelect?.(w)
  }

  // Full-page writeup view
  if (selected) {
    return (
      <WriteupPanel
        writeup={selected}
        onClose={() => pick(null)}
        onNavigateToNode={onNavigateToNode}
      />
    )
  }

  const filteredWriteups = writeups.filter(w => matchesPlatform(w, activePlatform))

  return (
    <div className="writeups-page">
      <div className="writeups-header">
        <div className="writeups-header-top">
          <div className="writeups-title">
            <span className="logo-dim">// </span>WRITEUPS
          </div>
          <span className="writeups-count">{filteredWriteups.length} boxes</span>
        </div>

        {isCompact ? (
          <div className="writeups-chips-inline">
            {WRITEUP_CHIPS.map(({ id, label }) => (
              <button
                key={id}
                className={`chip chip-${id} ${activePlatformSet.has(id) ? 'on' : 'off'}`}
                onClick={() => setActivePlatform(id)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <FilterBar
            chips={WRITEUP_CHIPS}
            active={activePlatformSet}
            onToggle={setActivePlatform}
            className="filter-bar-writeups"
          />
        )}
      </div>

      <div className="writeups-body">
        <div className="writeup-group">
          <div className="writeup-group-title">{PLATFORM_LABEL[activePlatform]}</div>
          <div className="writeup-grid">
            {filteredWriteups.map(w => {
              const diffKey  = w.difficulty?.toLowerCase()
              const isLocked = w.tags?.includes('active')
              return (
                <div
                  key={w.id}
                  className={`writeup-list-card${isLocked ? ' wu-locked' : ''}`}
                  onClick={isLocked ? undefined : () => pick(w)}
                >
                  <div className="wu-card-title">{w.title}</div>
                  {isLocked && <div className="wu-lock-badge">Machine Active</div>}
                  <div className="wu-card-meta">
                    {w.os && <span className="wu-os">{w.os}</span>}
                    {w.difficulty && (
                      <span className={`wu-diff ${DIFF_CLASS[diffKey] ?? ''}`}>
                        {w.difficulty}
                      </span>
                    )}
                  </div>
                  {w.attack_path?.length > 0 && (
                    <div className={`wu-card-path${isLocked ? ' wu-card-path-locked' : ''}`}>
                      {w.attack_path.slice(0, 5).join(' → ')}
                      {w.attack_path.length > 5 && ` +${w.attack_path.length - 5} more`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
