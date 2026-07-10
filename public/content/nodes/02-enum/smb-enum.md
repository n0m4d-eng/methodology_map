---
id: smb-enum
title: SMB Enumeration
stage: enumeration
tags: [windows, smb]
summary: Enumerate shares, users, and vulnerabilities over SMB — the most common Windows foothold service.
leads_to:
  - null-session
  - password-spray
  - public-exploit
  - printnightmare
---

## Prerequisites

Port 445 (or 139) open on target. No credentials required for null/guest session checks.

SMB is the first service you enumerate on any Windows target. It leaks OS version, domain name, hostname, user lists, share contents, and vulnerability status all before you have a single credential. The password policy check here is mandatory — skip it and you risk locking out accounts before a spray even starts.

## Quick Win

> Null session check — gets version, signing status, and share list in one shot.

```bash
nxc smb $TARGET -u '' -p ''
nxc smb $TARGET -u 'guest' -p ''
```

## Full Enumeration Chain

> Users, groups, shares, and password policy — run this if null/guest sessions work.

```bash
# Shares
smbclient -L //$TARGET/ -U '' -N
smbmap -H $TARGET -u '' -p ''

# Full dump
enum4linux-ng $TARGET

# RPC null session
rpcclient -U "" -N $TARGET
# > enumdomusers  → user list
# > enumdomgroups → group list
# > getdompwinfo  → password policy (check BEFORE spraying)
```

## Connect to a Share

> Grab files from an accessible share — look for configs, credentials, and backups.

```bash
smbclient //$TARGET/ShareName -U '' -N
smbclient //$TARGET/ShareName -U 'DOMAIN/user%password'

# Recursive download
smbclient //$TARGET/ShareName -N -c 'prompt; recurse; mget *'
smbclient //$TARGET/ShareName -U 'user%pass' -c 'recurse ON; ls'
```

## Vulnerability Check

> Checks for EternalBlue (MS17-010) and MS08-067 — either leads directly to SYSTEM.

```bash
nmap -Pn -p 445 --script smb-vuln* $TARGET
```

## What to Look For in Shares

- `*.config`, `*.xml`, `*.ini` — may contain plaintext creds
- `web.config`, `.sqlconfig` — DB credentials
- Files modified recently — active service config
- Writable shares → stage files for NTLM relay / coercion

## Leads To

SMBv1 open → check public-exploit (EternalBlue → SYSTEM, no privesc needed). Null session user list → password-spray immediately. Signing disabled → ntlm-relay. Print Spooler running → printnightmare.
