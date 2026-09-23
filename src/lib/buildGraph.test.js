import { describe, it, expect } from 'vitest'
import { buildGraph } from './buildGraph'

function makeEngagement(statusByNodeId, overrides = {}) {
  const techStatus = new Map(
    Object.entries(statusByNodeId).map(([id, status]) => [id, { status, ts: 0 }])
  )
  return {
    discovered: new Set(),
    dismissed:  new Map(),
    techStatus,
    isActive: false,
    setNodeStatus: () => {},
    clearNodeStatus: () => {},
    ...overrides,
  }
}

const NODES = [
  { id: 'nmap-scan', stage: 'recon', tags: ['linux'], leads_to: ['web-enum'] },
  { id: 'web-enum',  stage: 'enumeration', tags: ['linux'], leads_to: ['sqli-rce', 'xss-csrf'] },
  { id: 'sqli-rce',  stage: 'initial-access', tags: ['linux'], leads_to: ['rev-shell'] },
  { id: 'xss-csrf',  stage: 'initial-access', tags: ['windows'], leads_to: [] },
  { id: 'rev-shell', stage: 'foothold', tags: ['linux'], leads_to: [] },
]

describe('buildGraph — path highlighting', () => {
  it('marks a success edge when both ends succeeded, and a dead-end edge when the target failed', () => {
    const engagement = makeEngagement({
      'nmap-scan': 'succeeded', 'web-enum': 'succeeded', 'xss-csrf': 'tried-failed',
    })
    const { edges } = buildGraph(NODES, [], new Set(), engagement)
    expect(edges.find(e => e.id === 'nmap-scan→web-enum').data.pathState).toBe('success')
    expect(edges.find(e => e.id === 'web-enum→xss-csrf').data.pathState).toBe('dead-end')
    expect(edges.find(e => e.id === 'sqli-rce→rev-shell').data.pathState).toBe(null)
  })

  it('path edges are visible unconditionally, regardless of the filter', () => {
    const engagement = makeEngagement({ 'nmap-scan': 'succeeded', 'web-enum': 'tried-failed' })
    // filter to windows only — nmap-scan and web-enum are both tagged linux
    const { nodes, edges } = buildGraph(NODES, [], new Set(['windows']), engagement)
    const nmapNode = nodes.find(n => n.id === 'nmap-scan')
    const webNode  = nodes.find(n => n.id === 'web-enum')
    const edge     = edges.find(e => e.id === 'nmap-scan→web-enum')
    expect(nmapNode.hidden).toBe(false)
    expect(webNode.hidden).toBe(false)
    expect(edge.hidden).toBe(false)
  })

  it('does not make a path-touched node\'s unrelated edges visible', () => {
    const engagement = makeEngagement({ 'nmap-scan': 'succeeded', 'web-enum': 'succeeded', 'sqli-rce': 'succeeded' })
    const { edges } = buildGraph(NODES, [], new Set(['windows']), engagement)
    const unrelatedEdge = edges.find(e => e.id === 'web-enum→xss-csrf')
    expect(unrelatedEdge.data.pathState).toBe(null)
    expect(unrelatedEdge.hidden).toBe(true)
  })

  it('removes path highlighting reactively when a status is cleared', () => {
    const withStatus = makeEngagement({ 'nmap-scan': 'succeeded', 'web-enum': 'succeeded' })
    const cleared     = makeEngagement({ 'nmap-scan': 'succeeded' })
    const before = buildGraph(NODES, [], new Set(), withStatus)
    const after  = buildGraph(NODES, [], new Set(), cleared)
    expect(before.edges.find(e => e.id === 'nmap-scan→web-enum').data.pathState).toBe('success')
    expect(after.edges.find(e => e.id === 'nmap-scan→web-enum').data.pathState).toBe(null)
  })
})

describe('buildGraph — node data for the status dropdown', () => {
  it('attaches sessionActive and the status callbacks to every node', () => {
    const setNodeStatus   = () => {}
    const clearNodeStatus = () => {}
    const engagement = makeEngagement({}, { isActive: true, setNodeStatus, clearNodeStatus })
    const { nodes } = buildGraph(NODES, [], new Set(), engagement)
    for (const n of nodes.filter(n => n.type === 'techniqueNode')) {
      expect(n.data.sessionActive).toBe(true)
      expect(n.data.onSetStatus).toBe(setNodeStatus)
      expect(n.data.onClearStatus).toBe(clearNodeStatus)
    }
  })

  it('defaults sessionActive to false when there is no engagement', () => {
    const { nodes } = buildGraph(NODES, [], new Set(), null)
    const techNode = nodes.find(n => n.type === 'techniqueNode')
    expect(techNode.data.sessionActive).toBe(false)
  })
})
