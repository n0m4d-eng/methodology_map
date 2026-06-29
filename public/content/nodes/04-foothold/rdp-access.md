---
id: rdp-access
title: RDP Access
stage: foothold
tags: [windows]
tools:
  - xfreerdp /u:user /p:password /v:$TARGET
  - xfreerdp /u:Administrator /pth:NTLM_HASH /v:$TARGET
  - nmap -Pn -p 3389 --script rdp-enum-encryption $TARGET
leads_to:
  - token-impersonation
  - windows-stored-creds
  - bloodhound
---

## Connect

```bash
xfreerdp /u:user /p:password /v:$TARGET
xfreerdp /u:Administrator /pth:NTLM_HASH /v:$TARGET   # pass-the-hash
xfreerdp /u:user /p:password /v:$TARGET /cert-ignore   # skip cert errors
```

## Check

```bash
nmap -Pn -p 3389 --script rdp-enum-encryption $TARGET
nxc rdp $TARGET -u user -p password
```

## Notes

RDP gives a full GUI session. Useful when interactive tools (BloodHound GUI, browser-based admin panels) are needed. Once in, run PowerShell as admin and work the Windows privesc checklist.
