---
id: dns-enum
title: DNS Enumeration
stage: enumeration
tags: [windows, linux, web]
tools:
  - dig axfr @$TARGET $DOMAIN
  - dnsrecon -d $DOMAIN -t axfr
  - gobuster dns -d $DOMAIN -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
  - dnsrecon -d $DOMAIN -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt
leads_to:
  - web-enum
  - nmap-scan
---

## Zone Transfer (try first — leaks everything)

```bash
dig axfr @$TARGET $DOMAIN
dig axfr @$DNS_SERVER $DOMAIN
host -l $DOMAIN $TARGET
dnsrecon -d $DOMAIN -t axfr
```

## Subdomain Brute Force

```bash
gobuster dns -d $DOMAIN -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
dnsrecon -d $DOMAIN -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt
wfuzz -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -H "Host: FUZZ.$DOMAIN" -u http://$TARGET --hw 0
```

## Reverse Lookup

```bash
nslookup $TARGET $TARGET
dig -x $TARGET_IP @$TARGET
```

## Notes

Add any discovered hostnames to `/etc/hosts`. A zone transfer success means you have the full map of the domain — enumerate every hostname returned.
