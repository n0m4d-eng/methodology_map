// Determines whether a leads_to edge (source -> target) should be highlighted
// as part of the session path: 'success' if both ends succeeded, 'dead-end' if
// the source succeeded but the target was tried and failed, null otherwise.
export function computeEdgePathState(sourceStatus, targetStatus) {
  if (sourceStatus !== 'succeeded') return null
  if (!targetStatus) return null
  return targetStatus === 'succeeded' ? 'success' : 'dead-end'
}
