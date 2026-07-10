---
id: dns-enum
title: DNS Enumeration
stage: enumeration
tags: [windows, linux, web, dns]
summary: Extract subdomains and internal hostnames via zone transfer and brute force — expands the attack surface significantly.
leads_to:
  - web-enum
  - nmap-scan
---

## Prerequisites

Port 53 TCP/UDP open. A domain name to enumerate (get from SMB banner, SSL cert, or web server headers).

DNS enumeration finds targets that don't show up in port scans. A zone transfer (AXFR) on a misconfigured server dumps every hostname in the domain in one request. Even without a zone transfer, brute-forcing subdomains reveals internal apps, dev instances, and management interfaces that live behind different vhosts.

## Quick Win

> Zone transfer — dumps the entire DNS zone if the server allows it.

```bash
dig axfr @$TARGET $DOMAIN
```

## Zone Transfer (Multiple Methods)

> Try all three — different tools have different success rates on edge cases.

```bash
dig axfr @$DNS_SERVER $DOMAIN
host -l $DOMAIN $TARGET
dnsrecon -d $DOMAIN -t axfr
```

## Subdomain Brute Force

> Word-list based discovery — finds subdomains the zone transfer didn't reveal.

```bash
gobuster dns -d $DOMAIN -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
dnsrecon -d $DOMAIN -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt
```

## Reverse Lookup

> Resolve an IP back to a hostname — often reveals the real domain name from a bare IP.

```bash
dig -x $TARGET_IP @$DNS_SERVER
nslookup $TARGET_IP $DNS_SERVER
```

## Leads To

Every discovered hostname goes into `/etc/hosts`, then into nmap-scan (new IPs) or web-enum (new vhosts). Zone transfer success is a separate security finding — document it. Internal hostnames like `dev.domain.local`, `internal.domain.local` frequently expose unpatched apps or admin panels.
