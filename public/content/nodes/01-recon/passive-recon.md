---
id: passive-recon
title: Passive Recon / OSINT
stage: recon
tags: [web]
summary: Gather target intelligence without touching the target — subdomains, emails, ASN ranges, and breach data.
leads_to:
  - dns-enum
  - web-enum
---

## Prerequisites

A domain name or company name. No credentials required — this is all public data.

Passive recon builds your target picture before you make a single packet hit the target. It's more impactful in real engagements and CPTS external assessments than in OSCP CTF boxes, but user lists from LinkedIn and subdomains from certificate transparency can unlock password spraying and vhost discovery that active scanning alone would miss.

## Quick Win

> Certificate transparency gives subdomains without touching the target.

```bash
curl -s "https://crt.sh/?q=%25.$DOMAIN&output=json" | jq -r '.[].name_value' | sort -u
```

## Subdomain Enumeration

> Passive DNS sources — finds real subdomains from public records and certificates.

```bash
subfinder -d $DOMAIN
amass enum -passive -d $DOMAIN
```

## Email / User Harvesting

> Emails from public sources → usernames for password spraying.

```bash
theHarvester -d $DOMAIN -b all
```

## WHOIS / ASN

> Reveals IP ranges owned by the target — useful for defining scope on external assessments.

```bash
whois $DOMAIN
```

## Shodan (external attack surface)

> Finds exposed services, banners, and CVEs without scanning — check before active recon.

```bash
# In browser: https://www.shodan.io/search?query=$DOMAIN
# Or CLI:
shodan search "hostname:$DOMAIN"
```

## Breach Data

> Leaked credentials for the domain — try before spraying to find real passwords.

```bash
# Check haveibeenpwned API or dehashed.com for domain
# Look for patterns: common password bases, complexity requirements
```

## Leads To

Subdomains discovered → add to `/etc/hosts` → feed into web-enum and dns-enum. User lists from LinkedIn/email harvesting → format to `firstname.lastname` → use in password-spray. Any login portals found → try breach credentials immediately.
