---
id: password-cracking
title: Password Cracking
stage: initial-access
tags: [windows, linux]
summary: Crack captured hashes offline with hashcat or john — NTLMv2 from Responder, AS-REP and TGS blobs from Kerberos attacks, and /etc/shadow from file read all land here before becoming usable credentials.
leads_to:
  - password-spray
  - ssh-access
  - winrm
  - rev-shell
---

## Prerequisites

A hash to crack: NTLMv2 from Responder/relay, AS-REP blob from ASREPRoasting, TGS blob from Kerberoasting, NT hash from SAM/NTDS dump, or `/etc/shadow` line from Linux file read. hashcat with GPU is preferred; john on CPU is the fallback.

Cracking is the bridge between hash capture and credential use. The hash type determines the mode — identify it before running hashcat. For exam environments, always try rockyou.txt first with rules; most passwords are weak variants. RC4 Kerberos tickets (`$krb5tgs$23$`) crack orders of magnitude faster than AES256 (`$krb5tgs$18$`).

## Quick Win

> Rockyou + best64 rules covers most exam/lab passwords in minutes.

```bash
hashcat -a 0 -m MODE hash.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
```

## Hash Type Reference

```
-m 0      MD5
-m 100    SHA1
-m 1000   NTLM (NT hash from SAM/NTDS)
-m 5600   NetNTLMv2 (Responder capture)
-m 18200  Kerberos AS-REP ($krb5asrep$23$)
-m 13100  Kerberos TGS RC4 ($krb5tgs$23$)
-m 19700  Kerberos TGS AES256 ($krb5tgs$18$)
-m 1800   sha512crypt (/etc/shadow, Linux)
-m 3200   bcrypt ($2*$)
-m 500    md5crypt ($1$, Apache)
```

## Identify Hash Type

```bash
hashcat --identify hash.txt
# Or: name-that-hash
nth --text '$krb5asrep$23$...'
```

## hashcat Modes

```bash
# Dictionary attack
hashcat -a 0 -m 5600 ntlmv2.txt /usr/share/wordlists/rockyou.txt

# Dictionary + rules (most effective for exam boxes)
hashcat -a 0 -m 5600 ntlmv2.txt /usr/share/wordlists/rockyou.txt \
  -r /usr/share/hashcat/rules/best64.rule \
  -r /usr/share/hashcat/rules/dive.rule

# Brute force (short passwords)
hashcat -a 3 -m 1000 ntlm.txt ?a?a?a?a?a?a

# Combinator (two wordlists combined)
hashcat -a 1 -m 1000 ntlm.txt words1.txt words2.txt
```

## john

```bash
# Auto-detect format
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt

# Specific format
john hash.txt --format=krb5asrep --wordlist=/usr/share/wordlists/rockyou.txt
john hash.txt --format=NT --wordlist=/usr/share/wordlists/rockyou.txt

# Show cracked
john --show hash.txt
```

## Wordlist Generation

```bash
# Generate targeted list from target organisation name
cewl http://TARGET -d 3 -m 5 > cewl.txt
hashcat -a 0 -m 1000 ntlm.txt cewl.txt -r /usr/share/hashcat/rules/best64.rule

# Mutate a known base password
echo 'Password' | hashcat --stdout -r /usr/share/hashcat/rules/best64.rule > mutated.txt
```

## Unshadow (Linux)

```bash
# Combine /etc/passwd and /etc/shadow for john
unshadow passwd shadow > unshadowed.txt
john unshadowed.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

## Leads To

Cracked NTLMv2 → password-spray across subnets, or direct winrm/rdp-access if it's a domain account. Cracked AS-REP or TGS → spray the password or use for bloodhound enumeration with new account. Cracked Linux shadow hash → ssh-access with that password. Cracked NT hash → pass-the-hash (use hash directly, no need to crack to plaintext).
