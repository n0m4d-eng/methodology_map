#!/usr/bin/env node
/**
 * Generates public/content/nodes-index.json and public/content/writeups-index.json
 * from frontmatter in public/content/nodes/ and public/content/writeups/.
 *
 * Run: node scripts/build-index.js
 * Auto-runs via the `prebuild` and `dev` npm scripts.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT        = join(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'public', 'content')
const NODES_DIR   = join(CONTENT_DIR, 'nodes')
const WRITEUPS_DIR = join(CONTENT_DIR, 'writeups')

// ── Frontmatter parser (mirrors src/lib/parseFrontmatter.js) ─────────────────

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, body: raw }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: raw }

  const yaml = raw.slice(4, end).trim()
  const body = raw.slice(end + 4).trim()
  const data = {}

  let currentList = null

  for (const line of yaml.split('\n')) {
    const listMatch = line.match(/^\s+-\s+(.+)$/)
    if (listMatch && currentList !== null) {
      currentList.push(strip(listMatch[1]))
      continue
    }

    // Supports space-in-key YAML like "date started:"
    const kvMatch = line.match(/^([\w][\w -]*):\s*(.*)$/)
    if (!kvMatch) continue

    const key = kvMatch[1].replace(/ /g, '_')
    const val = kvMatch[2].trim()

    if (!val) {
      currentList = []
      data[key] = currentList
    } else if (val.startsWith('[')) {
      data[key] = val.slice(1, val.lastIndexOf(']'))
        .split(',').map(s => strip(s.trim())).filter(Boolean)
      currentList = null
    } else {
      data[key] = strip(val)
      currentList = null
    }
  }

  return { data, body }
}

function strip(s) { return s.replace(/^['"]|['"]$/g, '').trim() }

// ── File walker ───────────────────────────────────────────────────────────────

function walkMd(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walkMd(full))
    } else if (entry.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

// ── Node index ────────────────────────────────────────────────────────────────

function buildNodesIndex() {
  const files = walkMd(NODES_DIR)
  return files.map(full => {
    const raw = readFileSync(full, 'utf8')
    const { data } = parseFrontmatter(raw)
    const slug = full.split('/').pop().replace(/\.md$/, '')
    // filePath relative to public/content/ so DetailPanel can fetch /content/${filePath}
    const filePath = relative(CONTENT_DIR, full)
    return {
      id:         data.id         ?? slug,
      title:      data.title      ?? slug,
      stage:      data.stage      ?? 'recon',
      tags:       data.tags       ?? [],
      tools:      data.tools      ?? [],
      leads_to:   data.leads_to   ?? [],
      summary:    data.summary    ?? '',
      references: data.references ?? [],
      filePath,
    }
  })
}

// ── Writeup index ─────────────────────────────────────────────────────────────

function buildWriteupsIndex() {
  const files = walkMd(WRITEUPS_DIR)
  return files.map(full => {
    const raw = readFileSync(full, 'utf8')
    const { data } = parseFrontmatter(raw)
    const slug = full.split('/').pop().replace(/\.md$/, '')
    const filePath = relative(CONTENT_DIR, full)
    return {
      id:             data.id             ?? slug,
      title:          data.title          ?? slug,
      platform:       data.platform       ?? '',
      os:             data.os             ?? '',
      difficulty:     data.difficulty     ?? '',
      date:           data.date_started   ?? data.date ?? '',
      tags:           data.tags           ?? [],
      key_techniques: data.key_techniques ?? [],
      attack_path:    data.attack_path    ?? [],
      summary:        data.summary        ?? '',
      filePath,
    }
  })
}

// ── Write output ──────────────────────────────────────────────────────────────

mkdirSync(CONTENT_DIR, { recursive: true })

const nodes    = buildNodesIndex()
const writeups = buildWriteupsIndex()

writeFileSync(join(CONTENT_DIR, 'nodes-index.json'),    JSON.stringify(nodes,    null, 2))
writeFileSync(join(CONTENT_DIR, 'writeups-index.json'), JSON.stringify(writeups, null, 2))

console.log(`✓ nodes-index.json    — ${nodes.length} nodes`)
console.log(`✓ writeups-index.json — ${writeups.length} writeups`)
