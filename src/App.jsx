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

const NODE_TYPES = {
  techniqueNode: TechniqueNode,
  laneHeader:    LaneHeader,
}

const ALL_TAGS    = new Set(MAP_CHIPS.map(c => c.id))
const MIN_PANEL_W = 290
const ACID_GREEN  = '#7fff00'

function FlowController({ selected, nodesLoaded }) {
  const { fitView } = useReactFlow()
  const fittedOnLoad = useRef(false)

  // Fit once when nodes arrive from the fetch
  useEffect(() => {
    if (nodesLoaded && !fittedOnLoad.current) {
      fittedOnLoad.current = true
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 350 }), 100)
      return () => clearTimeout(t)
    }
  }, [nodesLoaded, fitView])

  // Fit again when selection clears
  useEffect(() => {
    if (!selected) {
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 350 }), 60)
      return () => clearTimeout(t)
    }
  }, [selected, fitView])

  return null
}

export default function App() {
  const { techniqueNodes, writeups } = useContent()

  const [page,           setPage]           = useState('map')
  const [activeTags,     setActiveTags]     = useState(ALL_TAGS)
  const [selected,       setSelected]       = useState(null)
  const [panelOpen,      setPanelOpen]      = useState(false)
  const [pendingWriteup, setPendingWriteup] = useState(null)
  const [panelWidth,     setPanelWidth]     = useState(() => Math.round(window.innerWidth * 0.5))
  const [showOutgoing,   setShowOutgoing]   = useState(true)
  const [showIncoming,   setShowIncoming]   = useState(true)
  const isResizing = useRef(false)

  const graphData = useMemo(
    () => buildGraph(techniqueNodes, writeups, activeTags, ''),
    [techniqueNodes, writeups, activeTags]
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
  }, [selected, graphData.edges])

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

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return
      if (panelOpen)  { setPanelOpen(false);  return }
      if (selected)   { setSelected(null);    return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [panelOpen, selected])

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
    setPendingWriteup(writeup)
    setPage('writeups')
  }

  function handleNavigateToNode(nodeId) {
    const rfNode = graphData.nodes.find(n => n.id === nodeId && n.type === 'techniqueNode')
    if (rfNode) {
      setSelected(rfNode)
      setPanelOpen(true)
    }
    setPage('map')
  }

  function handleNavigate(newPage) {
    if (newPage !== 'writeups') setPendingWriteup(null)
    setPage(newPage)
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <button className="nav-logo" onClick={() => handleNavigate('about')}>
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
              <FlowController selected={selected} nodesLoaded={techniqueNodes.length > 0} />
              <Background color="#21262d" gap={24} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          {selected && panelOpen && (
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
        />
      )}

      {page === 'about' && <AboutPage />}
    </div>
  )
}
