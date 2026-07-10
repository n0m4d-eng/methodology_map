---
id: ssh-enum
title: SSH Enumeration
stage: enumeration
tags: [windows, linux, ssh]
summary: Banner grab for version-based exploits, check auth methods to know if password brute-force is viable, and test default credentials before running full wordlists.
leads_to:
  - ssh-access
  - password-spray
  - public-exploit
---

## Prerequisites

Port 22 open (also check 2222, 2200, 22022). No credentials required for banner grab and auth method check.

SSH enumeration answers two questions before you spend time brute-forcing: Does this version have a known CVE? And does it even accept password authentication? If it's `publickey` only, brute-force won't work — hunt for key files elsewhere in the engagement instead. The version banner is worth checking against searchsploit every time.

## Quick Win

> Banner grab — version + check for auth methods in one pass.

```bash
nc -nv $TARGET 22
nmap -p22 --script ssh-auth-methods,banner --script-args ssh.user=root $TARGET
```

## Fingerprint

> Cipher suites and host key type — weak ciphers signal an old/unpatched server.

```bash
nmap -p22 --script ssh-hostkey,ssh2-enum-algos $TARGET
```

## Default Credentials (try before brute force)

```
root:root   root:toor   admin:admin   admin:password
pi:raspberry   vagrant:vagrant   ubuntu:ubuntu
```

## Brute Force

> Only viable if password auth is enabled — confirm with ssh-auth-methods first.

```bash
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/wordlists/rockyou.txt ssh://$TARGET -t 4 -V
```

```bash
nxc ssh $TARGET -u users.txt -p passwords.txt --continue-on-success
nxc ssh $CIDR -u user -p password --continue-on-success   # spray across subnet
```

## Username Enumeration (OpenSSH < 7.7)

> Timing differences in error responses leak valid usernames on old versions.

```bash
use auxiliary/scanner/ssh/ssh_enumusers
set RHOSTS $TARGET
set USER_FILE /usr/share/seclists/Usernames/top-usernames-shortlist.txt
run
```

## Leads To

Valid credentials found → ssh-access. Old version with known CVE → public-exploit. Username list discovered → password-spray across other protocols. `publickey` only → hunt for `id_rsa` files in FTP, NFS, web, or after getting a shell on a different service.
