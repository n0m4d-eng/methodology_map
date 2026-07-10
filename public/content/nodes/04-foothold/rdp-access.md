---
id: rdp-access
title: RDP Access
stage: foothold
tags: [windows, rdp]
summary: Connect to Windows via RDP for a full GUI session — supports pass-the-hash and is the best interface for interactive tools like BloodHound and browser-based admin panels.
leads_to:
  - token-impersonation
  - windows-stored-creds
  - windows-dll-hijack
  - windows-uac-bypass
  - windows-gpp-creds
  - bloodhound
---

## Prerequisites

Port 3389 open. Valid Windows credentials or NTLM hash (xfreerdp supports pass-the-hash natively). User must be in the Remote Desktop Users group or local Administrators. NLA (Network Level Authentication) may require valid credentials before the connection is established.

RDP gives a full Windows GUI session — useful when tools require interactive input, when you need to click through UAC prompts, or when working with browser-based admin panels. For shell-only work, WinRM is faster. Use RDP when you need the desktop.

## Quick Win

> Connect with credentials — `/cert-ignore` skips the self-signed cert warning.

```bash
xfreerdp /u:user /p:password /v:$TARGET /cert-ignore
```

## Connect

> Password auth and pass-the-hash variants.

```bash
xfreerdp /u:user /p:password /v:$TARGET /cert-ignore
xfreerdp /u:Administrator /pth:NTLM_HASH /v:$TARGET /cert-ignore
```

## Verify Before Connecting

> Confirm RDP is accessible and accepting credentials without opening a GUI session.

```bash
nmap -Pn -p 3389 --script rdp-enum-encryption $TARGET
nxc rdp $TARGET -u user -p password
```

## Leads To

GUI session → open PowerShell as Administrator → `whoami /priv` for token impersonation → GodPotato/PrintSpoofer for SYSTEM. GUI access → install and run BloodHound ingestor interactively. UAC bypass required → test fodhelper/eventvwr registry hijacks from an elevated prompt. Credential Manager visible in GUI → windows-stored-creds.
