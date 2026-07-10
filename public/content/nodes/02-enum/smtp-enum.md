---
id: smtp-enum
title: SMTP Enumeration
stage: enumeration
tags: [windows, linux, smtp]
tools:
  - smtp-user-enum -M VRFY -U /usr/share/metasploit-framework/data/wordlists/unix_users.txt -t $TARGET
  - nmap -Pn -p 25 --script smtp-enum-users,smtp-commands $TARGET
  - swaks --to test@$DOMAIN --from att@att.com --server $TARGET
leads_to:
  - password-spray
---

## User Enumeration

```bash
# Manual
nc -nnv $TARGET 25
VRFY root
VRFY admin
RCPT TO: <root@localhost>
EXPN administrators

# Automated
smtp-user-enum -M VRFY -U /usr/share/metasploit-framework/data/wordlists/unix_users.txt -t $TARGET
smtp-user-enum -M RCPT -U users.txt -t $TARGET

nmap -Pn -p 25 --script smtp-enum-users,smtp-commands $TARGET
```

## Open Relay Test

```bash
swaks --to victim@example.com --from attacker@attacker.com --server $TARGET
```

## Notes

VRFY and EXPN responses differ between valid and invalid users on misconfigured MTAs. Feed the user list into password-spray. Open relay is a separate finding but rarely a foothold vector.
