import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useContent }        from '@/hooks/useContent'
import { useEngagement }     from '@/hooks/useEngagement'
import { useMediaQuery }     from '@/hooks/useMediaQuery'
import { buildGraph }        from '@/lib/buildGraph'
import { TechniqueNode }     from '@/components/TechniqueNode'
import { LaneHeader }        from '@/components/LaneHeader'
import { DetailPanel }       from '@/components/DetailPanel'
import { FilterBar, MAP_CHIPS } from '@/components/FilterBar'
import { GraphOptions }      from '@/components/GraphOptions'
import { NavDropdown }       from '@/components/NavDropdown'
import { GlobalSearch }      from '@/components/GlobalSearch'
import { WriteupsPage }      from '@/components/WriteupsPage'
import { AboutPage }         from '@/components/AboutPage'
import { KeyboardHints }     from '@/components/KeyboardHints'
import { EngagementPanel }   from '@/components/EngagementPanel'

const NODE_TYPES = {
  techniqueNode: TechniqueNode,
  laneHeader:    LaneHeader,
}

function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (h.startsWith('writeups/')) return { page: 'writeups', writeupId: h.slice(9) }
  if (h === 'writeups') return { page: 'writeups', writeupId: null }
  if (h === 'about')    return { page: 'about',    writeupId: null }
  return { page: 'map', writeupId: null }
}

function setHash(pg, writeupId = null) {
  const h = writeupId ? `writeups/${writeupId}` : pg === 'map' ? '' : pg
  history.replaceState(null, '', h ? `#${h}` : window.location.pathname)
}

const ALL_TAGS    = new Set(MAP_CHIPS.map(c => c.id))
const MIN_PANEL_W = 290
const ACID_GREEN  = '#7fff00'

function FlowController({ selected, nodesLoaded, keyboardNavCount, fitViewRef }) {
  const { fitView } = useReactFlow()
  const fittedOnLoad = useRef(false)
  const selectedRef  = useRef(selected)
  useEffect(() => { selectedRef.current = selected }, [selected])

  // Expose fitView so the external fit-view button can call it
  fitViewRef.current = fitView

  // Fit once when nodes arrive from the fetch
  useEffect(() => {
    if (nodesLoaded && !fittedOnLoad.current) {
      fittedOnLoad.current = true
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 350 }), 100)
      return () => clearTimeout(t)
    }
  }, [nodesLoaded, fitView])

  // Pan to node on keyboard navigation — read selected via ref so this effect
  // only fires on nav events, not on every selection change (e.g. mouse click)
  useEffect(() => {
    if (!keyboardNavCount || !selectedRef.current) return
    fitView({ nodes: [{ id: selectedRef.current.id }], padding: 0.8, maxZoom: 1.2, duration: 220 })
  }, [keyboardNavCount, fitView])

  // Fit full view when selection clears
  useEffect(() => {
    if (!selected) {
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 350 }), 60)
      return () => clearTimeout(t)
    }
  }, [selected, fitView])

  return null
}

export default function App() {
  const { techniqueNodes, writeups, error } = useContent()
  const isCompact = useMediaQuery('(max-width: 1100px)')
  const fitViewRef = useRef(null)

  const [page,            setPage]            = useState(() => parseHash().page)
  const [activeTags,      setActiveTags]      = useState(ALL_TAGS)
  const [selected,        setSelected]        = useState(null)
  const [panelOpen,       setPanelOpen]       = useState(false)
  const [pendingWriteup,  setPendingWriteup]  = useState(null)
  const [pendingWriteupId, setPendingWriteupId] = useState(() => parseHash().writeupId)
  const [panelWidth,      setPanelWidth]      = useState(() => Math.round(window.innerWidth * 0.5))
  const [showOutgoing,    setShowOutgoing]    = useState(true)
  const [showIncoming,    setShowIncoming]    = useState(true)
  const [hintsOpen,       setHintsOpen]       = useState(false)
  const [keyboardNavCount, setKeyboardNavCount] = useState(0)
  const isResizing = useRef(false)
  const engagement = useEngagement()

  const graphData = useMemo(
    () => buildGraph(techniqueNodes, writeups, activeTags, {
      discovered: engagement.discovered,
      dismissed:  engagement.dismissed,
    }),
    [techniqueNodes, writeups, activeTags, engagement.discovered, engagement.dismissed]
  )

  const effectiveEdges = useMemo(() => {
    if (!selected) return graphData.edges.map(e => ({ ...e, hidden: true }))

    return graphData.edges.map(e => {
      const isOut     = e.source === selected.id
      const isIn      = e.target === selected.id
      const visible   = (isOut && showOutgoing) || (isIn && showIncoming)
      const hidden    = e.hidden || !visible
      if (!visible) return { ...e, hidden }

      const color = isOut ? ACID_GREEN : '#58a6ff'
      return {
        ...e,
        hidden,
        style:       { stroke: color, strokeWidth: 1.5 },
        markerEnd:   { type: 'arrowclosed', color, width: 14, height: 14 },
        pathOptions: { borderRadius: 12 },
      }
    })
  }, [graphData.edges, selected, showOutgoing, showIncoming])

  const connectedNodeIds = useMemo(() => {
    if (!selected) return null
    const ids = new Set([selected.id])
    graphData.edges.forEach(e => {
      if (showOutgoing && e.source === selected.id) ids.add(e.target)
      if (showIncoming && e.target === selected.id) ids.add(e.source)
    })
    return ids
  }, [selected, graphData.edges, showOutgoing, showIncoming])

  const displayNodes = useMemo(() => {
    if (!connectedNodeIds) return graphData.nodes
    return graphData.nodes.map(n =>
      n.type !== 'techniqueNode' || connectedNodeIds.has(n.id)
        ? n
        : { ...n, data: { ...n.data, dimmed: true } }
    )
  }, [graphData.nodes, connectedNodeIds])

  const [nodes, setNodes, onNodesChange] = useNodesState(displayNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(effectiveEdges)

  useEffect(() => { setNodes(displayNodes) }, [displayNodes])
  useEffect(() => { setEdges(effectiveEdges)  }, [effectiveEdges])

  // Resolve writeup ID from hash once writeups have loaded
  useEffect(() => {
    if (!pendingWriteupId || !writeups.length) return
    const found = writeups.find(w => w.id === pendingWriteupId)
    if (found) { setPendingWriteup(found); setPendingWriteupId(null) }
  }, [writeups, pendingWriteupId])

  // ── Keyboard navigation on the map ─────────────────────────────────────────
  const navigateMap = useCallback((key) => {
    const techNodes = displayNodes.filter(n => n.type === 'techniqueNode' && !n.hidden)
    if (!techNodes.length) return

    if (!selected) {
      setSelected(techNodes[0])
      setKeyboardNavCount(c => c + 1)
      return
    }

    const current = techNodes.find(n => n.id === selected.id)
    if (!current) {
      setSelected(techNodes[0])
      setKeyboardNavCount(c => c + 1)
      return
    }

    const { x: cx, y: cy } = current.position
    let next = null

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const col = techNodes.filter(n => n.position.x === cx).sort((a, b) => a.position.y - b.position.y)
      const idx = col.findIndex(n => n.id === current.id)
      if (key === 'ArrowDown' && idx < col.length - 1) next = col[idx + 1]
      if (key === 'ArrowUp'   && idx > 0)              next = col[idx - 1]
    } else if (key === 'ArrowRight') {
      const rightNodes = techNodes.filter(n => n.position.x > cx)
      if (rightNodes.length) {
        const nextX = Math.min(...rightNodes.map(n => n.position.x))
        const candidates = rightNodes.filter(n => n.position.x === nextX)
        next = candidates.reduce((a, b) =>
          Math.abs(a.position.y - cy) <= Math.abs(b.position.y - cy) ? a : b)
      }
    } else if (key === 'ArrowLeft') {
      const leftNodes = techNodes.filter(n => n.position.x < cx)
      if (leftNodes.length) {
        const prevX = Math.max(...leftNodes.map(n => n.position.x))
        const candidates = leftNodes.filter(n => n.position.x === prevX)
        next = candidates.reduce((a, b) =>
          Math.abs(a.position.y - cy) <= Math.abs(b.position.y - cy) ? a : b)
      }
    }

    if (next) {
      setSelected(next)
      setKeyboardNavCount(c => c + 1)
    }
  }, [displayNodes, selected])

  // ── Global keydown handler ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const inInput = document.activeElement?.tagName === 'INPUT'

      // Focus search with /
      if (e.key === '/' && !inInput) {
        e.preventDefault()
        document.querySelector('.nav-search')?.focus()
        return
      }

      // Toggle hints with ?
      if (e.key === '?' && !inInput) {
        setHintsOpen(h => !h)
        return
      }

      // Escape: close things in priority order (skip if search input has focus — GlobalSearch handles it)
      if (e.key === 'Escape') {
        if (inInput)    return
        if (panelOpen)  { setPanelOpen(false);  return }
        if (selected)   { setSelected(null);    return }
        if (hintsOpen)  { setHintsOpen(false);  return }
        return
      }

      // Map-only shortcuts — only when on the map page and not typing
      if (page !== 'map' || inInput) return

      if (e.key === 'Enter' && selected) {
        setPanelOpen(true)
        return
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        navigateMap(e.key)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [panelOpen, selected, hintsOpen, page, navigateMap])

  const onNodeClick = useCallback((_, node) => {
    if (node.type === 'laneHeader') return
    if (selected?.id === node.id) {
      setPanelOpen(true)
    } else {
      setSelected(node)
      setPanelOpen(true)
    }
  }, [selected])

  const onPaneClick = useCallback(() => {
    setPanelOpen(false)
  }, [])

  function toggleTag(tag) {
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const startResize = useCallback((e) => {
    e.preventDefault()
    isResizing.current = true
    const onMove = (e) => {
      if (!isResizing.current) return
      const w = window.innerWidth - e.clientX
      setPanelWidth(Math.max(MIN_PANEL_W, Math.min(window.innerWidth * 0.5, w)))
    }
    const onUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [])

  function handleOpenWriteup(writeup) {
    if (writeup.tags?.includes('active')) return
    setPendingWriteup(writeup)
    setPage('writeups')
    setHash('writeups', writeup.id)
  }

  function handleNavigateToNode(nodeId) {
    const rfNode = graphData.nodes.find(n => n.id === nodeId && n.type === 'techniqueNode')
    if (rfNode) {
      setSelected(rfNode)
      setPanelOpen(true)
    }
    setPage('map')
    setHash('map')
  }

  function handleNavigate(newPage) {
    setPendingWriteup(null)
    setPage(newPage)
    setHash(newPage)
  }

  function handleWriteupSelect(writeup) {
    if (writeup) setHash('writeups', writeup.id)
    else { setPendingWriteup(null); setHash('writeups') }
  }

  return (
    <div className="app-root">
      {error && <div className="content-error">{error}</div>}
      <header className="app-header">
        <button className="nav-logo" onClick={() => handleNavigate('map')}>
          N<span className="logo-dim">0</span>M4D
        </button>
        <NavDropdown currentPage={page} onNavigate={handleNavigate} />

        <GlobalSearch
          nodes={techniqueNodes}
          writeups={writeups}
          onSelectNode={handleNavigateToNode}
          onSelectWriteup={handleOpenWriteup}
        />
      </header>

      {page === 'map' && (
        <div className="app-body">
          <div className="flow-wrap">
            {isCompact ? (
              <div className="compact-controls-stack">
                <FilterBar
                  chips={MAP_CHIPS}
                  active={activeTags}
                  onToggle={toggleTag}
                  vertical
                />
                <GraphOptions
                  showOutgoing={showOutgoing}
                  showIncoming={showIncoming}
                  onToggleOutgoing={() => setShowOutgoing(v => !v)}
                  onToggleIncoming={() => setShowIncoming(v => !v)}
                  vertical
                />
              </div>
            ) : (
              <>
                <FilterBar
                  chips={MAP_CHIPS}
                  active={activeTags}
                  onToggle={toggleTag}
                />
                <GraphOptions
                  showOutgoing={showOutgoing}
                  showIncoming={showIncoming}
                  onToggleOutgoing={() => setShowOutgoing(v => !v)}
                  onToggleIncoming={() => setShowIncoming(v => !v)}
                />
              </>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              minZoom={0.2}
              maxZoom={2}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
            >
              <FlowController
                selected={selected}
                nodesLoaded={techniqueNodes.length > 0}
                keyboardNavCount={keyboardNavCount}
                fitViewRef={fitViewRef}
              />
              <Background color="#21262d" gap={24} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>

            <EngagementPanel
              discovered={engagement.discovered}
              dismissed={engagement.dismissed}
              discoveredArray={engagement.discoveredArray}
              addService={engagement.addService}
              removeService={engagement.removeService}
              dismissService={engagement.dismissService}
              undismissService={engagement.undismissService}
              clearSession={engagement.clearSession}
              isActive={engagement.isActive}
            />

            {/* Fit-to-view button — touch affordance, hidden on desktop via CSS */}
            <button
              className="fitview-btn"
              onClick={() => fitViewRef.current?.({ padding: 0.15, duration: 350 })}
              aria-label="Fit graph to view"
            >⊡</button>

            {/* Bottom sheet + dim overlay (compact screens ≤1100px) */}
            {isCompact && selected && panelOpen && (
              <>
                <div className="dim-overlay" onClick={() => setPanelOpen(false)} />
                <DetailPanel
                  node={selected}
                  onClose={() => setPanelOpen(false)}
                  onOpenWriteup={handleOpenWriteup}
                  onNavigateToNode={handleNavigateToNode}
                  sheet
                />
              </>
            )}
          </div>

          {/* Desktop side panel (wide screens >1100px) */}
          {!isCompact && selected && panelOpen && (
            <DetailPanel
              node={selected}
              width={panelWidth}
              onClose={() => setPanelOpen(false)}
              onOpenWriteup={handleOpenWriteup}
              onResizeStart={startResize}
              onNavigateToNode={handleNavigateToNode}
            />
          )}
        </div>
      )}

      {page === 'writeups' && (
        <WriteupsPage
          writeups={writeups}
          initialWriteup={pendingWriteup}
          onNavigateToNode={handleNavigateToNode}
          onSelect={handleWriteupSelect}
        />
      )}

      {page === 'about' && <AboutPage />}

      {!isCompact && <KeyboardHints open={hintsOpen} onToggle={() => setHintsOpen(h => !h)} />}
    </div>
  )
}
