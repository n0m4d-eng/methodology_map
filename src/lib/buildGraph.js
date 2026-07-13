import { MarkerType } from '@xyflow/react'

export const ALL_SERVICE_TAGS = new Set([
  'ssh', 'rdp', 'winrm', 'vnc', 'telnet',
  'smb', 'ftp', 'nfs', 'rsync', 'tftp', 'webdav',
  'web', 'elasticsearch',
  'smtp', 'pop3', 'imap',
  'mssql', 'mysql', 'postgresql', 'mongodb', 'oracle', 'redis',
  'dns', 'snmp', 'ntp', 'ipmi',
  'ldap', 'ad', 'ad-dc', 'kerberos', 'adcs',
  'docker', 'kubernetes',
])

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

const COL_WIDTH  = 260
const COL_GAP    = 100
const NODE_H     = 88
const NODE_GAP   = 14
const START_X    = 24
const NODE_Y     = 70  // below lane header
const HEADER_Y   = 12

// Builds the full node/edge list for React Flow from parsed content + active filters.
// Nodes that don't match are hidden (not removed) so React Flow keeps their positions stable.
export function buildGraph(techniqueNodes, writeups, activeTags, engagement = null) {
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

  function passesChipFilter(n) {
    if (activeTags.size === 0) return true
    const nodeTags = n.tags ?? []
    if (activeTags.has('windows') && nodeTags.includes('windows')) return true
    if (activeTags.has('linux')   && nodeTags.includes('linux'))   return true
    if (activeTags.has('ad')      && nodeTags.includes('ad'))      return true
    if (activeTags.has('recon')   && n.stage === 'recon')          return true
    if (activeTags.has('misc')) {
      const isCategorized = nodeTags.includes('windows') || nodeTags.includes('linux') ||
                            nodeTags.includes('ad') || n.stage === 'recon'
      if (!isCategorized) return true
    }
    return false
  }

  function isVisible(n) {
    if (!passesChipFilter(n)) return false
    if (!engagement || engagement.discovered.size === 0) return true
    const nodeTags = n.tags ?? []
    const svcTags  = nodeTags.filter(t => ALL_SERVICE_TAGS.has(t))
    if (svcTags.length === 0) return true
    return svcTags.some(t => engagement.discovered.has(t))
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

    let engDismissed = false
    if (engagement && engagement.discovered.size > 0) {
      const nodeTags = node.tags ?? []
      const discoveredSvcTags = nodeTags.filter(
        t => ALL_SERVICE_TAGS.has(t) && engagement.discovered.has(t)
      )
      if (discoveredSvcTags.length > 0) {
        engDismissed = discoveredSvcTags.every(t => engagement.dismissed.has(t))
      }
    }

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
        dismissed:  engDismissed,
        techStatus: engagement?.techStatus?.get(node.id)?.status ?? 'untried',
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
