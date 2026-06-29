---
# REQUIRED — unique kebab-case ID, referenced by other nodes' leads_to arrays
id: technique-name

# REQUIRED — human-readable title shown on the node card
title: Technique Name

# REQUIRED — which phase this technique belongs to
# Options: recon | enumeration | initial-access | foothold | privesc | objective
stage: enumeration

# REQUIRED — at least one OS tag + any relevant service/category tags
# See content/SCHEMA.md for the full tag vocabulary
# Format: [tag1, tag2, tag3]
tags: [linux, web, enum]

# OPTIONAL — key commands shown in the Commands panel on the map
# Keep to the most important one-liners; full detail goes in the body below
tools:
  - tool --flag $TARGET
  - tool2 -u $USER -p $PASS $TARGET

# OPTIONAL — which node IDs this technique feeds into (draws edges in the graph)
# Must match the `id` field of an existing node
leads_to:
  - target-node-id
  - another-node-id

# OPTIONAL — one-sentence description for future search/preview UI
summary: Brief description of what this technique achieves and when to use it.

# OPTIONAL — external references (HackTricks, GTFOBins, OffSec docs, etc.)
references:
  - https://book.hacktricks.xyz/...
  - https://gtfobins.github.io/...
---

## Quick Syntax

```bash
# Primary command — copy-paste ready
tool --flag value $TARGET

# Variant / alternative
tool2 -u $USER -p $PASS $TARGET
```

## When to Use

- Condition one (what port/service/context must exist)
- Condition two
- Prerequisite or dependency

## Steps

1. First step
2. Second step — explain what to look for in the output
3. Third step

## Notes

Key gotchas, caveats, or things that commonly trip you up. Exam-specific notes go here.
Reference related techniques inline when helpful.
