---
# REQUIRED — platform-machinename in kebab-case
id: htb-machinename

# REQUIRED — display title shown in the writeup panel and list card
title: "HTB - MachineName"

# REQUIRED — controls grouping on the Writeups page
# Options: HackTheBox | PGPractice | PGPlay | TryHackMe | VulnLab | OSCP | CPTS | Other
platform: HackTheBox

# REQUIRED
os: Linux

# REQUIRED
# Options: Easy | Medium | Hard | Insane
difficulty: Easy

# REQUIRED
date: YYYY-MM-DD

# REQUIRED — OS tag first, then services encountered, then specific technique tags
# Use the same vocabulary as nodes (see content/SCHEMA.md)
tags: [linux, web, smb]

# RECOMMENDED — 2-5 techniques worth highlighting on your resume/portfolio
# These are displayed prominently in the writeup panel
key_techniques:
  - Technique or concept name
  - Another notable technique

# REQUIRED — ordered list of node IDs tracing the full kill chain
# Must match `id` fields in content/nodes/. Missing IDs are silently skipped.
attack_path:
  - nmap-scan
  - web-enum
  - ...

# RECOMMENDED — one sentence for portfolio display and resume bullets
summary: "Exploited X vulnerability on a Y service to gain initial access, then escalated via Z."
---

## Overview

What was this box about? What made it interesting or what did you learn?
One short paragraph.

## Enumeration

### Nmap

```
# paste scan output or summary
```

Key findings: port X running Y version Z.

### [Service Name]

What you found and what it told you.

## Initial Access

How you got your first shell. Include the key commands.

```bash
# commands used
```

## Privilege Escalation

Walk through the privesc chain step by step.

```bash
# commands used
```

## Proof

```
hostname: MACHINENAME
whoami: root / SYSTEM
```

## Lessons Learned

- What was new or unfamiliar
- What you would do differently next time
- Any rabbit holes that wasted time — and why
