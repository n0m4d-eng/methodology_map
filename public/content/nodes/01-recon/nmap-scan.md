---
id: nmap-scan
title: Nmap / RustScan
stage: recon
tags: [windows, linux]
summary: Fast port discovery followed by targeted service scanning — the first thing you run on every target.
leads_to:
  - smb-enum
  - ldap-enum
  - web-enum
  - nfs-enum
  - ftp-enum
  - smtp-enum
  - mssql-enum
  - mysql-enum
  - redis-enum
  - dns-enum
  - snmp-enum
  - ssh-enum
  - rdp-enum
  - kerberos-enum
  - ipmi-enum
  - postgresql-enum
  - rsync-enum
  - vnc-enum
---

## Prerequisites

Network access to the target (direct or via proxychains through a pivot).

Before touching any service, write two sentences: *What do I think this system is and what is it doing?* and *What would have to be misconfigured for it to be exploitable?* Form the hypothesis first — enumerate to test it. RustScan finds open ports in seconds; Nmap then probes only those ports for service banners and default scripts.

## Quick Win

> Fast full-port sweep — finish in under 30 seconds, then pipe into Nmap.

```bash
rustscan -a $TARGET --ulimit 5000 -b 500 -- -Pn 2>/dev/null | tee recon/rustscan.out
PORTS=$(grep -oP '\d+(?=/tcp)' recon/rustscan.out | tr '\n' ',' | sed 's/,$//')
sudo nmap -Pn -sC -sV -p $PORTS -oN recon/tcp.out $TARGET
```

## Targeted Nmap (when RustScan isn't available)

> Full-port TCP scan with scripts and versions — slower but self-contained.

```bash
sudo nmap -Pn -sC -sV -p- --open -oN recon/tcp.out $TARGET
```

## UDP (always run in background)

> UDP often missed — reveals SNMP (161), IPMI (623), DNS (53), TFTP (69).

```bash
sudo nmap -Pn -sU --top-ports 20 -oN recon/udp.out $TARGET &
```

## Route by Finding

| Port | Next step |
|------|-----------|
| 80 / 443 | → web-enum |
| 139 / 445 | → smb-enum |
| 88 / 389 / 3268 | DC found → ldap-enum, kerberos-enum |
| 21 | → ftp-enum |
| 22 | → ssh-enum |
| 25 | → smtp-enum |
| 161 UDP | → snmp-enum |
| 623 UDP | → ipmi-enum |
| 873 | → rsync-enum |
| 1433 | → mssql-enum |
| 2049 | → nfs-enum |
| 3306 | → mysql-enum |
| 3389 | → rdp-enum |
| 5432 | → postgresql-enum |
| 5900–5910 | → vnc-enum |
| 5985 / 5986 | → winrm (try found creds) |
| 6379 | → redis-enum |

## Key Flags

| Flag | Purpose |
|------|---------|
| `-Pn` | Skip host discovery (assume up) |
| `-p-` | All 65535 ports |
| `--open` | Only show open ports |
| `-sC` | Default scripts |
| `-sV` | Version detection |
| `-oN` | Normal output to file |
| `--min-rate 5000` | Speed up (can miss ports on unstable links) |

## Leads To

Every open port maps to an enumeration node. Work the port table above — don't skip UDP (SNMP and IPMI are frequently the fastest path to credentials). Once services are identified, branch into the relevant enum nodes simultaneously.
