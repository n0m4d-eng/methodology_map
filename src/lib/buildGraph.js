import { MarkerType } from '@xyflow/react'

// Stage order → column index
export const STAGES = {
  'recon':          0,
  'enumeration':    1,
  'initial-access': 2,
  'foothold':       3,
  'privesc':        4,
  'objective':      5,
}

export const STAGE_LABELS = {
  'recon':          'Recon',
  'enumeration':    'Enumeration',
  'initial-access': 'Initial Access',
  'foothold':       'Foothold',
  'privesc':        'Privilege Escalation',
  'objective':      'Objective',
}

const COL_WIDTH  = 210
const COL_GAP    = 100
const NODE_H     = 88
const NODE_GAP   = 14
const START_X    = 24
const NODE_Y     = 70  // below lane header
const HEADER_Y   = 12

// Builds the full node/edge list for React Flow from parsed content + active filters.
// Nodes that don't match are hidden (not removed) so React Flow keeps their positions stable.
export function buildGraph(techniqueNodes, writeups, activeTags, search) {
  // visit count per technique node id
  const visitCounts = {}
  writeups.forEach(w => {
    ;(w.attack_path ?? []).forEach(id => {
      visitCounts[id] = (visitCounts[id] ?? 0) + 1
    })
  })

  // which writeups reference a given node id
  const writeupsByNode = {}
  writeups.forEach(w => {
    ;(w.attack_path ?? []).forEach(id => {
      if (!writeupsByNode[id]) writeupsByNode[id] = []
      writeupsByNode[id].push(w)
    })
  })

  // group by stage so we can assign y positions
  const byStage = {}
  techniqueNodes.forEach(n => {
    ;(byStage[n.stage] ??= []).push(n)
  })

  function isVisible(n) {
    let tagOk = activeTags.size === 0
    if (!tagOk) {
      const nodeTags = n.tags ?? []
      if (activeTags.has('windows') && nodeTags.includes('windows')) tagOk = true
      if (activeTags.has('linux')   && nodeTags.includes('linux'))   tagOk = true
      if (activeTags.has('ad')      && nodeTags.includes('ad'))      tagOk = true
      if (activeTags.has('recon')   && n.stage === 'recon')          tagOk = true
      if (activeTags.has('misc')) {
        const isCategorized = nodeTags.includes('windows') || nodeTags.includes('linux') ||
                              nodeTags.includes('ad') || n.stage === 'recon'
        if (!isCategorized) tagOk = true
      }
    }
    const q = search.toLowerCase().trim()
    const searchOk = !q ||
      n.title.toLowerCase().includes(q) ||
      (n.tags ?? []).some(t => t.toLowerCase().includes(q))
    return tagOk && searchOk
  }

  const rfNodes = []

  // Lane header nodes (one per stage, not interactive)
  Object.entries(STAGE_LABELS).forEach(([stage, label]) => {
    const col = STAGES[stage] ?? 0
    rfNodes.push({
      id: `__lane__${stage}`,
      type: 'laneHeader',
      position: { x: START_X + col * (COL_WIDTH + COL_GAP), y: HEADER_Y },
      data: { label },
      draggable:   false,
      selectable:  false,
      focusable:   false,
      deletable:   false,
    })
  })

  // Technique nodes
  const visible = new Set()
  techniqueNodes.forEach(node => {
    const col    = STAGES[node.stage] ?? 0
    const stageList = byStage[node.stage] ?? []
    const yIdx   = stageList.findIndex(n => n.id === node.id)
    const x      = START_X + col * (COL_WIDTH + COL_GAP)
    const y      = NODE_Y + yIdx * (NODE_H + NODE_GAP)
    const hidden = !isVisible(node)

    if (!hidden) visible.add(node.id)

    rfNodes.push({
      id:     node.id,
      type:   'techniqueNode',
      position: { x, y },
      hidden,
      data: {
        ...node,
        visited:    (visitCounts[node.id] ?? 0) > 0,
        visitCount: visitCounts[node.id] ?? 0,
        relatedWriteups: writeupsByNode[node.id] ?? [],
      },
    })
  })

  // Edges from leads_to declarations
  const rfEdges = []
  techniqueNodes.forEach(node => {
    ;(node.leads_to ?? []).forEach(targetId => {
      const bothVisible = visible.has(node.id) && visible.has(targetId)

      rfEdges.push({
        id:     `${node.id}→${targetId}`,
        source: node.id,
        target: targetId,
        type:   'smoothstep',
        hidden: !bothVisible,
        style: {
          stroke:      '#30363d',
          strokeWidth: 1,
        },
        markerEnd: {
          type:   MarkerType.ArrowClosed,
          color:  '#30363d',
          width:  14,
          height: 14,
        },
      })
    })
  })

  return { nodes: rfNodes, edges: rfEdges }
}
