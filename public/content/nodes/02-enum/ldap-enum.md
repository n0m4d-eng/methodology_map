---
id: ldap-enum
title: LDAP Enumeration
stage: enumeration
tags: [windows, ad, ldap]
tools:
  - ldapsearch -H ldap://$TARGET -x -b "" -s base namingContexts
  - ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" -s sub "(objectClass=*)" | grep -iE "sAMAccountName|description|mail|memberOf"
  - ldapdomaindump -u '' $TARGET
  - nxc ldap $TARGET -u '' -p ''
leads_to:
  - asreproast
  - kerberoast
  - password-spray
---

## Anonymous Bind

```bash
# Confirm anonymous bind works + get naming context
ldapsearch -H ldap://$TARGET -x -b "" -s base namingContexts

# Dump everything (replace DC= values)
ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" -s sub "(objectClass=*)" \
  | grep -iE "sAMAccountName|description|mail|memberOf|userAccountControl"

# Dump to HTML/JSON (great for reading offline)
ldapdomaindump -u '' $TARGET

# Quick user list via nxc
nxc ldap $TARGET -u '' -p '' --users
```

## With Credentials

```bash
ldapsearch -H ldap://$TARGET -x -D "cn=user,dc=domain,dc=local" -w password -b "dc=domain,dc=local"
nxc ldap $TARGET -u user -p password --users
nxc ldap $TARGET -u user -p password --gmsa
```

## Key Flags to Hunt

```bash
# Find AS-REP roastable accounts (DONT_REQ_PREAUTH = 4194304 in decimal)
ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" \
  "(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" sAMAccountName

# All accounts + descriptions (descriptions often contain passwords)
ldapsearch -H ldap://$TARGET -x -b "DC=domain,DC=local" \
  "(objectClass=user)" sAMAccountName description
```

## Notes

Anonymous binds frequently work on HTB/OSCP DCs. Pull the user list into a file and immediately run AS-REP roasting against it — you don't need passwords yet.

Description fields on user accounts regularly contain plaintext credentials in exam environments.
