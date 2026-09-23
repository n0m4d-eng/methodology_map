import { useState, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'engagement_session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { discovered: [], techniques: {} }
    const p = JSON.parse(raw)
    return {
      discovered: Array.isArray(p.discovered) ? p.discovered : [],
      techniques: p.techniques && typeof p.techniques === 'object' ? p.techniques : {},
    }
  } catch { return { discovered: [], techniques: {} } }
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
    mutate(p => ({ ...p, discovered: p.discovered.filter(s => s !== svc) }))
  , [mutate])

  const setNodeStatus = useCallback((nodeId, status) =>
    mutate(p => ({ ...p, techniques: { ...p.techniques, [nodeId]: { status, ts: Date.now() } } }))
  , [mutate])

  const clearNodeStatus = useCallback((nodeId) =>
    mutate(p => { const { [nodeId]: _, ...rest } = p.techniques; return { ...p, techniques: rest } })
  , [mutate])

  const clearSession = useCallback(() => {
    const empty = { discovered: [], techniques: {} }
    saveSession(empty)
    setSession(empty)
  }, [])

  // Memoize derived Set/Map so their references are stable across renders.
  // Without this, useMemo in App.jsx sees new object references every render
  // (even when session hasn't changed), causing buildGraph to re-run on every
  // render and triggering a setNodes render loop via the useEffect.
  const discovered  = useMemo(() => new Set(session.discovered), [session.discovered])
  const techStatus  = useMemo(() => new Map(Object.entries(session.techniques)), [session.techniques])

  return {
    discovered,
    techStatus,
    techniques: session.techniques,
    discoveredArray: session.discovered,
    addService,
    removeService,
    setNodeStatus,
    clearNodeStatus,
    clearSession,
    isActive: session.discovered.length > 0 || Object.keys(session.techniques).length > 0,
  }
}
