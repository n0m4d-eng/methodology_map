---
id: web-enum
title: Web Enumeration
stage: enumeration
tags: [web]
summary: Identify web stack, discover hidden paths, and find attack surface before touching any functionality.
leads_to:
  - sqli-rce
  - lfi-rce
  - file-upload-shell
  - ssti-rce
  - public-exploit
  - responder
  - password-spray
  - command-injection
  - ssrf
  - xxe-injection
  - jwt-attack
  - xss-csrf
---

## Prerequisites

Port 80 or 443 open. Add any vhosts/subdomains to `/etc/hosts` before starting.

Web enum is about understanding the stack before attacking it. The tech you identify (PHP/Apache vs ASP.NET vs Java) completely changes your extension list, exploit paths, and what default creds to try. Vhost fuzzing is often skipped but catches entire internal apps that don't respond on the IP directly — always run it.

## Quick Win

> Tech ID + immediate manual checks — fast and often finds low-hanging fruit before tooling.

```bash
whatweb -a 3 http://$TARGET
curl -I http://$TARGET
# Check: Server, X-Powered-By, cookie names (PHPSESSID=PHP, JSESSIONID=Java, ASP.NET_SessionId=.NET)
```

Manual checks before busting:
```
/robots.txt   /.git/   /.env   /web.config   /phpinfo.php
/backup.zip   /backup.tar.gz   /changelog.txt   /README.md
```

## SSL Certificate — Extra Hostnames

> SAN fields in certs leak internal hostnames — add them all to /etc/hosts.

```bash
openssl s_client -connect $TARGET:443 </dev/null 2>/dev/null | openssl x509 -noout -text | grep -i "dns:"
```

## Directory Busting

> Find hidden paths, files, and endpoints — adjust extensions for the target stack.

```bash
# PHP
feroxbuster -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x php,html,txt,bak,zip,conf -t 40 --auto-tune -o recon/ferox.out

# ASP.NET
feroxbuster -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x asp,aspx,ashx,config,bak -t 40 --auto-tune

# Alternative (gobuster)
gobuster dir -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x php,txt,html,bak,zip -t 40
```

## VHost / Subdomain Fuzzing

> Find apps that only respond to a specific Host header — common in internal environments.

```bash
# Get baseline word count first, then filter on it
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -u http://$TARGET -H "Host: FUZZ.$DOMAIN" -fw <baseline_word_count>

gobuster vhost -u http://$TARGET -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
```

## CMS Scanners

> Identify CMS version and enumerate plugins/themes for known CVEs.

```bash
wpscan --url http://$TARGET --enumerate vp,vt,u,ap --plugins-detection aggressive   # WordPress
droopescan scan drupal -u http://$TARGET                                              # Drupal
joomscan -u http://$TARGET                                                            # Joomla
nikto -h http://$TARGET
```

## Parameter Fuzzing

> Find hidden GET/POST parameters that alter app behaviour — often leads to SQLi or LFI.

```bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
  -u "http://$TARGET/page.php?FUZZ=test" -fs <baseline_size>
```

## Default Creds

```
admin:admin   admin:password   admin:   root:root   guest:guest   test:test
```

## Leads To

Login form → try default creds + sqli-rce. File upload → file-upload-shell. URL with `?page=` or `?file=` → lfi-rce. Template-rendered user input → ssti-rce. CMS version hit → public-exploit. Outdated framework version → public-exploit.
