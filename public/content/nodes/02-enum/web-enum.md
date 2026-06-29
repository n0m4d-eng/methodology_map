---
id: web-enum
title: Web Enumeration
stage: enumeration
tags: [web]
tools:
  - whatweb -a 3 http://$TARGET && curl -sI http://$TARGET | grep -iE "server|x-powered|content-type"
  - feroxbuster -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,html,txt,bak,zip,conf -t 40 --auto-tune -o recon/ferox.out
  - ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://$TARGET -H "Host: FUZZ.$DOMAIN" -fw 0
  - gobuster dir -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,txt,html,bak,zip -t 40
leads_to:
  - sqli-rce
  - lfi-rce
  - file-upload-shell
  - ssti-rce
  - public-exploit
---

## Step 1 — Tech Identification (always first)

```bash
whatweb -a 3 http://$TARGET
curl -I http://$TARGET
# Check: Server version, X-Powered-By, cookies (PHPSESSID=PHP, ASP.NET_SessionId=.NET, JSESSIONID=Java)

# SSL cert — grab extra hostnames
openssl s_client -connect $TARGET:443 </dev/null 2>/dev/null | openssl x509 -noout -text | grep -i "dns:"
# Add any found hostnames to /etc/hosts
```

## Step 2 — Directory Busting

```bash
# PHP target
feroxbuster -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x php,html,txt,bak,zip,conf -t 40 --auto-tune -o recon/ferox.out

# ASP.NET target
feroxbuster -u http://$TARGET -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x asp,aspx,ashx,config,bak -t 40 --auto-tune

# Large wordlist (when medium misses things)
feroxbuster -u http://$TARGET -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt,bak
```

## Step 3 — Manual Checks (always before running heavy tools)

```
/robots.txt         /sitemap.xml        /.git/
/.env               /web.config         /.htaccess
/phpinfo.php        /changelog.txt      /README.md
/backup.zip         /backup.tar.gz      /crossdomain.xml
```

## Step 4 — VHost / Subdomain Fuzzing

```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -u http://$TARGET -H "Host: FUZZ.$DOMAIN" -fw <baseline_word_count>

gobuster vhost -u http://$TARGET -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
```

## CMS Scanners

```bash
wpscan --url http://$TARGET --enumerate vp,vt,u,ap --plugins-detection aggressive  # WordPress
droopescan scan drupal -u http://$TARGET                                             # Drupal
joomscan -u http://$TARGET                                                           # Joomla
nikto -h http://$TARGET
```

## Parameter Fuzzing

```bash
ffuf -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
  -u "http://$TARGET/page.php?FUZZ=test" -fs <baseline_size>
```

## Default Creds to Try on Login Pages

```
admin:admin   admin:password   admin:   root:root   guest:guest   test:test
```

## Notes

Stack fingerprint matters — PHP/Apache vs ASP.NET vs Java changes your extension list and exploit paths. Vhost fuzzing catches internal apps that don't respond on the IP directly.
