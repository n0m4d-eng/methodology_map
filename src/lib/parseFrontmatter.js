/**
 * Parses the YAML frontmatter and markdown body from a raw .md string.
 *
 * Supported schema:
 *   scalar:       key: value
 *   inline array: key: [a, b, c]
 *   block array:  key:\n  - a\n  - b
 */
export function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, body: raw }

  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: raw }

  const yaml = raw.slice(4, end).trim()
  const body = raw.slice(end + 4).trim()
  const data = {}

  let currentKey = null
  let currentList = null

  for (const line of yaml.split('\n')) {
    // Block array item
    const listMatch = line.match(/^\s+-\s+(.+)$/)
    if (listMatch && currentList !== null) {
      currentList.push(strip(listMatch[1]))
      continue
    }

    // Key: value
    const kvMatch = line.match(/^([\w-]+):\s*(.*)$/)
    if (!kvMatch) continue

    currentKey = kvMatch[1]
    const val = kvMatch[2].trim()

    if (!val) {
      currentList = []
      data[currentKey] = currentList
    } else if (val.startsWith('[')) {
      data[currentKey] = val
        .slice(1, val.lastIndexOf(']'))
        .split(',')
        .map(s => strip(s.trim()))
        .filter(Boolean)
      currentList = null
    } else {
      data[currentKey] = strip(val)
      currentList = null
    }
  }

  return { data, body }
}

function strip(s) {
  return s.replace(/^['"]|['"]$/g, '').trim()
}
