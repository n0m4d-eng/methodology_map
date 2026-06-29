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
Recommended sections: Quick Syntax · When to Use · Steps · Notes

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
