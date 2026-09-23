import { describe, it, expect } from 'vitest'
import { computeEdgePathState } from './pathState'

describe('computeEdgePathState', () => {
  it('returns "success" when both source and target succeeded', () => {
    expect(computeEdgePathState('succeeded', 'succeeded')).toBe('success')
  })

  it('returns "dead-end" when source succeeded but target failed', () => {
    expect(computeEdgePathState('succeeded', 'tried-failed')).toBe('dead-end')
  })

  it('returns null when the target has no status yet, even if source succeeded', () => {
    expect(computeEdgePathState('succeeded', undefined)).toBe(null)
  })

  it('returns null when the source did not succeed, regardless of target status', () => {
    expect(computeEdgePathState(undefined, 'succeeded')).toBe(null)
    expect(computeEdgePathState('tried-failed', 'succeeded')).toBe(null)
    expect(computeEdgePathState('tried-failed', 'tried-failed')).toBe(null)
  })

  it('returns null when neither node has a status', () => {
    expect(computeEdgePathState(undefined, undefined)).toBe(null)
  })
})
