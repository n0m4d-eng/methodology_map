# Content Authoring Guide

Quick reference for adding nodes and writeups. Copy the template, fill in the blanks, drop the file in the right folder. The prebuild script picks it up automatically on the next `npm run dev` or `npm run build`.

---

## File Locations

```
public/content/
├── nodes/
│   ├── 01-recon/          ← stage: recon
│   ├── 02-enum/           ← stage: enumeration
│   ├── 03-initial-access/ ← stage: initial-access
│   ├── 04-foothold/       ← stage: foothold
│   ├── 05-privesc/        ← stage: privesc
│   └── 06-objective/      ← stage: objective
└── writeups/
    ├── htb-forest.md      ← single-file writeup (no images)
    └── htb-sendai/        ← folder writeup (has images)
        ├── sendai.md
        └── images/
```

**Node file name:** `kebab-case-technique.md` — the filename becomes the fallback `id` if you forget to set one.

**Writeup file name:**

- No images → single `.md` file: `htb-machinename.md`
- Has images → folder: `htb-machinename/machinename.md` + `images/`

---

## Adding a Node

Template: `public/content/templates/node-template.md`

### Frontmatter fields

| Field        | Required | Notes                                                                                                                |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`         | Yes      | Kebab-case. Other nodes reference this in their `leads_to`. Must be unique.                                          |
| `title`      | Yes      | Shown on the node card. Title-case.                                                                                  |
| `stage`      | Yes      | Controls which column the node appears in. See stages below.                                                         |
| `tags`       | Yes      | One OS tag minimum. Controls map filtering and chip colours. See tags below.                                         |
| `tools`      | No       | One-liners shown in the Commands panel. Keep them copy-paste ready. Use `$TARGET`, `$USER`, `$PASS` as placeholders. |
| `leads_to`   | No       | List of node `id`s that this technique feeds into. Draws edges on the graph.                                         |
| `summary`    | No       | One sentence. Reserved for future search/preview UI.                                                                 |
| `references` | No       | Full URLs only. Shown as clickable links in the detail panel.                                                        |

### Stages

```
recon           → 01-recon/
enumeration     → 02-enum/
initial-access  → 03-initial-access/
foothold        → 04-foothold/
privesc         → 05-privesc/
objective       → 06-objective/
```

### Body sections (keep these headings)

```markdown
## Quick Syntax

# Primary commands, copy-paste ready

## When to Use

# Bulleted list of conditions/prerequisites

## Steps

# Numbered walkthrough

## Notes

# Gotchas, exam tips, common rabbit holes
```

---

## Adding a Writeup

Template: `public/content/templates/writeup-template.md`

### Frontmatter fields

| Field            | Required    | Notes                                                                              |
| ---------------- | ----------- | ---------------------------------------------------------------------------------- |
| `id`             | Yes         | `platform-machinename` in kebab-case. e.g. `htb-forest`                            |
| `title`          | Yes         | Display title. e.g. `"HTB - Forest"`                                               |
| `platform`       | Yes         | Controls grouping on the Writeups page. See platforms below.                       |
| `os`             | Yes         | `Linux` or `Windows` (capitalised).                                                |
| `difficulty`     | Yes         | `Easy`, `Medium`, `Hard`, or `Insane` (capitalised). Controls badge colour.        |
| `date`           | Yes         | `YYYY-MM-DD` format.                                                               |
| `tags`           | Yes         | OS tag first, then services, then specific techniques. Free-form — be descriptive. |
| `key_techniques` | Recommended | 2–5 techniques shown prominently in the writeup panel. These are resume bullets.   |
| `attack_path`    | Yes         | Ordered list of node `id`s tracing the kill chain. Must match existing node IDs.   |
| `summary`        | Recommended | One sentence for portfolio display.                                                |

### Platforms

The Writeups page groups cards by platform. The `matchesPlatform` function recognises these strings:

| `platform` value                                            | Appears under    |
| ----------------------------------------------------------- | ---------------- |
| `HackTheBox` or `HTB`                                       | HTB tab          |
| `OSCP`, `PGPractice`, `PGPlay`, `OffSec`, `Proving Grounds` | OSCP tab         |
| `Hack Smarter`                                              | Hack Smarter tab |

### Body sections (keep these headings)

```markdown
## Overview

# One paragraph — what made this box interesting?

## Enumeration

### Nmap

### [Service Name]

## Initial Access

## Privilege Escalation

## Proof

# hostname + whoami output

## Lessons Learned
```

### Images

Reference images with relative paths from the `.md` file:

```markdown
![alt text](images/screenshot.png)
```

The app rewrites these automatically to absolute `/content/...` paths on load. Store all screenshots in the `images/` subfolder of the writeup directory.

---

## Tag Vocabulary

### Node tags — use these exactly (they control map filtering and chip colours)

**OS (required — pick at least one):**

```
windows    linux
```

**Services (add any that apply):**

```
smb    ftp    nfs    web    smtp    ssh
rdp    winrm  dns    snmp   mssql   mysql
redis  mongodb
```

**Domain / Active Directory:**

```
ad    ldap    kerberos    adcs
```

**Phase hints (optional, no colour effect — for future use):**

```
enum    exploit    privesc    lateral    persistence    exfil
```

**Rules:**

- Keep node tags short and machine-readable. No spaces, no uppercase.
- The map filter has five buckets: `windows`, `linux`, `ad`, `recon` (stage-based, not a tag), and `misc` (everything else). Any node that doesn't match windows/linux/ad and isn't in the recon stage falls under misc.
- A node can have both `windows` and `linux` if the technique applies to both.

### Writeup tags — free-form, be descriptive

Writeup tags don't drive the map filter, so use full technique names:

```
# OS (required first)
windows    linux

# Platform
htb    oscp    cpts

# Services found
smb-enumeration    web    ldap-enumeration    nfs

# Techniques used
as-rep-roasting    kerberoasting    password-spraying    rid-brute-force
acl-abuse    dcsync    pass-the-hash    credential-hunting
bloodhound    gmsa    adcs    esc4    adminsdholder
winrm    ssh    rdp
```

---

## Connecting Writeups to Nodes

The `attack_path` field is what links a writeup to the map. Each entry must exactly match an existing node `id`.

```yaml
attack_path:
  - nmap-scan # ← must match id: nmap-scan in nodes/01-recon/
  - ldap-enum # ← must match id: ldap-enum in nodes/02-enum/
  - asreproast
  - winrm
  - acl-abuse
  - dcsync
  - domain-admin
```

- Order matters — it's displayed as a numbered kill chain in the writeup panel.
- Clicking a step in the panel navigates to that node on the map.
- A node's visit count badge (green number) increments once per writeup that includes it in `attack_path`.
- Missing IDs are silently skipped — double-check spelling if a step isn't showing up on the map.

---

## Checklist before saving

**Node:**

- [ ] `id` is unique and kebab-case
- [ ] `stage` matches the folder it's saved in
- [ ] At least one OS tag (`windows` or `linux`)
- [ ] All `leads_to` IDs exist as nodes
- [ ] Commands in `tools` are copy-paste ready with placeholder variables

**Writeup:**

- [ ] `id` matches the filename / folder name
- [ ] `platform` string matches one of the recognised values
- [ ] `difficulty` is capitalised (`Easy`, not `easy`)
- [ ] `date` is `YYYY-MM-DD`
- [ ] All `attack_path` IDs exist as nodes
- [ ] Images are in `images/` and referenced with relative paths
