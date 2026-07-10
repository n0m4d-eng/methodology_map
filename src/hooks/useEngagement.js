import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'engagement_session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { discovered: [], dismissed: {} }
    const p = JSON.parse(raw)
    return {
      discovered: Array.isArray(p.discovered) ? p.discovered : [],
      dismissed:  p.dismissed && typeof p.dismissed === 'object' ? p.dismissed : {},
    }
  } catch { return { discovered: [], dismissed: {} } }
}

function saveSession(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

export function useEngagement() {
  const [session, setSession] = useState(loadSession)

  const mutate = useCallback((fn) => {
    setSession(prev => { const next = fn(prev); saveSession(next); return next })
  }, [])

  const addService = useCallback((svc) =>
    mutate(p => p.discovered.includes(svc) ? p : { ...p, discovered: [...p.discovered, svc] })
  , [mutate])

  const removeService = useCallback((svc) =>
    mutate(p => {
      const { [svc]: _, ...rest } = p.dismissed
      return { discovered: p.discovered.filter(s => s !== svc), dismissed: rest }
    })
  , [mutate])

  const dismissService = useCallback((svc, note = '') =>
    mutate(p => ({ ...p, dismissed: { ...p.dismissed, [svc]: note } }))
  , [mutate])

  const undismissService = useCallback((svc) =>
    mutate(p => { const { [svc]: _, ...rest } = p.dismissed; return { ...p, dismissed: rest } })
  , [mutate])

  const clearSession = useCallback(() => {
    const empty = { discovered: [], dismissed: {} }
    saveSession(empty)
    setSession(empty)
  }, [])

  // Memoize derived Set/Map so their references are stable across renders.
  // Without this, useMemo in App.jsx sees new object references every render
  // (even when session hasn't changed), causing buildGraph to re-run on every
  // render and triggering a setNodes render loop via the useEffect.
  const discovered = useMemo(() => new Set(session.discovered), [session.discovered])
  const dismissed  = useMemo(() => new Map(Object.entries(session.dismissed)), [session.dismissed])

  return {
    discovered,
    dismissed,
    discoveredArray: session.discovered,
    addService,
    removeService,
    dismissService,
    undismissService,
    clearSession,
    isActive: session.discovered.length > 0,
  }
}
