# Content Schema & Tag Taxonomy

This document defines the schema for all content files and the canonical tag vocabulary.
Read this before adding new nodes or writeups.

---

## File Locations

| Type | Path | Picked up by site |
|---|---|---|
| Technique node | `content/nodes/<stage>/<id>.md` | Yes |
| Writeup | `content/writeups/<id>.md` | Yes |
| Template | `content/templates/` | No — editor reference only |

Stage folder names must match exactly:
`01-recon` `02-enum` `03-initial-access` `04-foothold` `05-privesc` `06-objective`

---

## Node Schema

```
id            string    unique kebab-case identifier — must match leads_to references
title         string    human-readable display name
stage         string    one of: recon | enumeration | initial-access | foothold | privesc | objective
tags          array     see Tag Taxonomy below
tools         array     key commands shown in the Commands panel (one-liners, include flags)
leads_to      array     node IDs this technique chains into (draws edges in the graph)
summary       string    one-sentence description — shown in future search/hover UI
references    array     external URLs: HackTricks, GTFOBins, IPPSEC, OffSec docs
```

Body (below `---`): full technique notes in markdown. Use `##` sections.
Structure: `Prerequisites` · `Quick Win` · one or more technique-specific sections · `Leads To`.
See **Content Style** below for how to write each section.

---

## Writeup Schema

```
id             string    platform-machinename in kebab-case e.g. htb-forest
title          string    "Platform - MachineName" e.g. "HTB - Forest"
platform       string    see Platform Values below
os             string    Windows | Linux | Other
difficulty     string    Easy | Medium | Hard | Insane
date           string    YYYY-MM-DD
tags           array     same taxonomy as nodes — OS + services used + named techniques
key_techniques array     2-5 techniques worth highlighting — shown prominently in the panel
attack_path    array     ordered node IDs tracing the full kill chain (must match node IDs)
summary        string    one sentence for portfolio/resume display
```

Body: full walkthrough in markdown. See writeup template for recommended structure.

---

## Platform Values

Use these exactly (controls grouping on the Writeups page):

| Platform | Value |
|---|---|
| Hack The Box | `HackTheBox` |
| Proving Grounds Practice | `PGPractice` |
| Proving Grounds Play | `PGPlay` |
| TryHackMe | `TryHackMe` |
| VulnLab | `VulnLab` |
| OSCP Exam | `OSCP` |
| CPTS Exam | `CPTS` |
| Other / Custom | `Other` |

---

## Tag Taxonomy

Tags serve two purposes: **filtering** (chips on the map page) and **visual context**
(colored labels on node cards). Apply the most specific applicable tags.

### OS Tags — always include one

| Tag | When to use |
|---|---|
| `windows` | Technique targets or runs on Windows |
| `linux` | Technique targets or runs on Linux |
| `macos` | Technique targets or runs on macOS |

### Service / Protocol Tags — include when technique is service-specific

| Tag | Service |
|---|---|
| `smb` | SMB / CIFS (port 445/139) |
| `web` | HTTP/S web applications |
| `ftp` | FTP (port 21) |
| `ssh` | SSH (port 22) |
| `rdp` | RDP (port 3389) |
| `smtp` | SMTP (port 25/587) |
| `ldap` | LDAP/LDAPS (port 389/636) |
| `mssql` | Microsoft SQL Server (port 1433) |
| `mysql` | MySQL / MariaDB (port 3306) |
| `redis` | Redis (port 6379) |
| `nfs` | NFS (port 2049) |
| `dns` | DNS (port 53) |
| `snmp` | SNMP (port 161) |
| `winrm` | WinRM (port 5985/5986) |

### Domain / Auth Tags

| Tag | When to use |
|---|---|
| `ad` | Active Directory — domain-joined context required |
| `kerberos` | Kerberos protocol attacks (AS-REP, Kerberoast, tickets) |
| `adcs` | Active Directory Certificate Services |

### Attack Phase Tags — supplement the stage

| Tag | When to use |
|---|---|
| `enum` | Pure enumeration, no exploitation |
| `exploit` | Exploiting a vulnerability |
| `privesc` | Privilege escalation technique |
| `lateral` | Lateral movement between hosts |
| `persistence` | Maintaining access |
| `exfil` | Data exfiltration |

### Specificity Tags — freeform, kebab-case

Add these when a technique is tied to a specific CVE, named exploit, or tool. They won't have
a colored chip but will render as gray labels on the node.

**Format rules:**
- CVE: `cve-YYYY-NNNNN` → e.g. `cve-2021-4034`, `cve-2022-0847`
- Named exploit: kebab-case name → e.g. `eternalblue`, `log4shell`, `pwnkit`, `dirtypipe`
- Tool name: lowercase, no spaces → e.g. `bloodhound`, `mimikatz`, `certipy`, `impacket`
- Platform (writeups only): `htb`, `pg`, `thm`, `vulnlab`

These grow with your skill set — add them freely. The site renders any unknown tag with a
default gray style.

---

## Leads-To Conventions

`leads_to` draws directed edges in the attack graph. Rules:
- Always reference an existing node `id` — a missing target is silently ignored
- A node can `leads_to` multiple targets (diverging path)
- Multiple nodes can `leads_to` the same target (converging path — DAG, not tree)
- Cycles are not meaningful — the graph represents methodology, not loops

---

## Content Style (Cheat-Sheet Format)

Node bodies should read like a quick-reference cheat sheet, not a written walkthrough — a
reader should know what's needed and what to run within a few seconds of opening the panel.

**Structure (all node bodies follow this shape):**
1. `## Prerequisites` — what's needed to attempt this technique
2. `## Quick Win` — the fastest path, as a one-line blockquote + code block
3. One or more technique-specific sections — each with a one-line blockquote above its code block
4. `## Leads To` — where this technique chains next

**Bullets over prose.** `Prerequisites` and `Leads To` are the two sections most prone to
turning into paragraphs — keep them as short bullet lists instead. A one-line "why this
works" note may follow as italic or blockquote text, but multi-sentence paragraphs should be
cut down to their bullet points.

Before:
```markdown
## Prerequisites

Port 22 open. Valid credentials, a private key found during enumeration (LFI, share access,
file read), or a username list for brute force. SSH is rarely brute-forced directly — most
SSH footholds come from credentials found elsewhere.
```

After:
```markdown
## Prerequisites

- Port 22 open

- Valid credentials, a private key found during enumeration, or a username list for brute force

- Rarely brute-forced directly — most SSH footholds come from credentials found elsewhere
```

**Blank line between every bullet — this is required, not stylistic.** Markdown only wraps
each `<li>`'s content in a `<p>` tag ("loose list") when there's a blank line between items;
the site's bullet CSS (`.body-html ul li`, a flex row with the `–` marker as `::before`) relies
on that `<p>` wrapper for its text to wrap correctly. Bullets written without blank lines
render as "tight" list items — the marker and text break onto separate, oddly-spaced lines
instead of flowing together. Always put one blank line between consecutive `- ` bullets.

**Tables stay tables — never bulletize them.** Any table cell containing a `→` character is a
routing table: the app makes the text after the arrow a clickable link to that node id (see
"Route by Finding" in `nmap-scan.md`). Converting a routing table to bullets or prose breaks
in-app navigation. Non-routing reference tables (flags, capabilities, comparisons) are already
scannable as tables and don't need converting either — leave both kinds of table exactly as-is.

**`Leads To` bullets vs. the Leads To accordion.** The bullets under `## Leads To` are for
human scanning (e.g. `` - SUID binary found → `linux-suid-caps` ``) — write them as plain list
text, not inside a table, so they don't trigger the routing-link behavior. Click-to-navigate is
already provided separately by the "LEADS TO (N)" accordion, which is generated from the
node's `leads_to` frontmatter, not from this body text.

For a worked example spanning a routing table, a reference table, and a pure-bullets case, see
`content/nodes/01-recon/nmap-scan.md`, `content/nodes/05-privesc/linux-suid-caps.md`, and
`content/nodes/04-foothold/ssh-access.md`.

---

## Growing This System

When you learn a new technique:
1. Copy `content/templates/node-template.md`
2. Place in the correct stage folder
3. Fill in frontmatter, add your notes in the body
4. Add the node `id` to any existing node's `leads_to` that chains into it

When you root a new box:
1. Copy `content/templates/writeup-template.md`
2. Fill in frontmatter including `attack_path` (must use existing node IDs)
3. Write the walkthrough in the body
4. The site auto-marks visited nodes green and shows writeup count badges
