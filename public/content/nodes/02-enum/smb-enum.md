---
id: smb-enum
title: SMB Enumeration
stage: enumeration
tags: [windows, smb]
tools:
  - nxc smb $TARGET -u '' -p ''
  - enum4linux-ng $TARGET
  - smbclient -L //$TARGET/ -U '' -N
  - smbmap -H $TARGET -u '' -p ''
  - rpcclient -U "" -N $TARGET -c "enumdomusers;enumdomgroups;netshareenum"
  - nmap -Pn -p 445 --script smb-vuln* $TARGET
leads_to:
  - null-session
  - password-spray
  - public-exploit
---

## Enumeration Chain

```bash
# 1. Quick version + signing check
nxc smb $TARGET

# 2. Null session — try both empty and guest
nxc smb $TARGET -u '' -p ''
nxc smb $TARGET -u 'guest' -p ''
nxc smb $TARGET -u 'anon' -p ''   # Guest enabled = any username + blank pass

# 3. List shares
smbclient -L //$TARGET/ -U '' -N
smbmap -H $TARGET

# 4. Full user/group enum
enum4linux-ng $TARGET

# 5. RPC null session
rpcclient -U "" -N $TARGET
# > enumdomusers  → user list
# > enumdomgroups → group list
# > getdompwinfo  → password policy (check before spraying)

# 6. Vuln check (EternalBlue MS17-010, MS08-067)
nmap -Pn -p 445 --script smb-vuln* $TARGET
```

## Connecting to Shares

```bash
smbclient //$TARGET/ShareName -U '' -N
smbclient //$TARGET/ShareName -U 'DOMAIN/user%password'

# Recursive download
smbclient //$TARGET/ShareName -N -c 'prompt; recurse; mget *'

# List recursively without downloading
smbclient //$TARGET/ShareName -U 'user%pass' -c 'recurse ON; ls'
```

## What to Look For in Shares

- `*.config`, `*.xml`, `*.ini` — may contain plaintext creds
- `web.config`, `.sqlconfig` — DB credentials
- Files modified recently (active service config)
- Writable shares → stage files for relay/coercion

## Notes

SMBv1 open → check for EternalBlue (MS17-010) and MS08-067. These lead directly to SYSTEM without privesc.

Password policy matters — run `getdompwinfo` or `nxc smb --pass-pol` before spraying.
