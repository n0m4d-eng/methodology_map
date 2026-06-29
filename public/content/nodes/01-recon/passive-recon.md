---
id: passive-recon
title: Passive Recon / OSINT
stage: recon
tags: [web]
tools:
  - theHarvester -d $DOMAIN -b all
  - whois $DOMAIN
  - subfinder -d $DOMAIN
  - amass enum -passive -d $DOMAIN
leads_to:
  - dns-enum
  - web-enum
---

## Notes

More relevant for real engagements than CTF boxes. Use before active scanning to build target picture without triggering alerts.

Harvest emails, subdomains, ASN ranges, and any credentials that appear in public breach data.

```bash
theHarvester -d $DOMAIN -b all
subfinder -d $DOMAIN
amass enum -passive -d $DOMAIN
whois $DOMAIN
```

Any hostnames found → add to `/etc/hosts` and feed into web-enum / dns-enum.
