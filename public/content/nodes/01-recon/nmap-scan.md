---
id: nmap-scan
title: Nmap / RustScan
stage: recon
tags: [windows, linux]
tools:
  - rustscan -a $TARGET --ulimit 5000 -b 500 -- -Pn 2>/dev/null | tee recon/rustscan.out
  - PORTS=$(grep -oP '\d+(?=/tcp)' recon/rustscan.out | tr '\n' ',' | sed 's/,$//'); sudo nmap -Pn -sC -sV -p $PORTS -oN recon/tcp.out $TARGET
  - sudo nmap -Pn -sU --top-ports 20 -oN recon/udp.out $TARGET &
  - sudo nmap -Pn -sC -sV -p- --open -oN recon/tcp.out $TARGET
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
---

## Before Touching Any Service

Write two sentences: *What do I think this system is and what is it doing?* and *What would have to be misconfigured for it to be exploitable?* Form the hypothesis first — enumerate to test it.

## Workflow

**Step 1 — RustScan (fast, all 65535 ports in seconds):**
```bash
rustscan -a $TARGET --ulimit 5000 -b 500 -- -Pn 2>/dev/null | tee recon/rustscan.out
PORTS=$(grep -oP '\d+(?=/tcp)' recon/rustscan.out | tr '\n' ',' | sed 's/,$//')
```

**Step 2 — Nmap deep scan on discovered ports only:**
```bash
sudo nmap -Pn -sC -sV -p $PORTS -oN recon/tcp.out $TARGET
```

**Step 3 — UDP always in background:**
```bash
sudo nmap -Pn -sU --top-ports 20 -oN recon/udp.out $TARGET &
```

## Route by Finding

| Port | Next step |
|------|-----------|
| 80 / 443 | → web-enum |
| 139 / 445 | → smb-enum |
| 88 / 389 / 3268 | DC found → ldap-enum |
| 21 | → ftp-enum |
| 25 | → smtp-enum |
| 161 UDP | → snmp-enum |
| 2049 | → nfs-enum |
| 1433 | → mssql-enum |
| 3306 | → mysql-enum |
| 6379 | → redis-enum |
| 5985 / 5986 | → winrm (try found creds) |

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
