---
id: snmp-enum
title: SNMP Enumeration
stage: enumeration
tags: [windows, linux, snmp]
summary: Read running processes, users, installed software, and open ports from SNMP — often unauthenticated with default community string 'public'.
leads_to:
  - password-spray
  - linux-cred-hunting
  - web-enum
---

## Prerequisites

Port 161 UDP open — will not appear in TCP-only scans. Default community string is usually `public` or `private`.

SNMP is frequently left with the default community string (`public`) and exposes an enormous amount of system data without authentication. On Windows, the running processes OID often contains credentials passed as CLI arguments (backup tools, monitoring agents). The local users OID gives you a username list for password spraying.

## Quick Win

> Community string brute — find a valid string before wasting time on the wrong one.

```bash
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt $TARGET
```

## Full Walk (Once String is Known)

> Dump everything the SNMP agent exposes — pipe through grep for credentials.

```bash
snmpwalk -c public -v2c $TARGET
snmp-check $TARGET -c public    # formatted, human-readable output
```

## Windows High-Value OIDs

> Target these OIDs directly to extract users, processes, and software without a full walk.

```bash
snmpwalk -c public -v1 $TARGET 1.3.6.1.4.1.77.1.2.25    # Local users → username list
snmpwalk -c public -v1 $TARGET 1.3.6.1.2.1.25.4.2.1.2   # Running processes → look for CLI passwords
snmpwalk -c public -v1 $TARGET 1.3.6.1.2.1.6.13.1.3     # Open TCP ports
snmpwalk -c public -v1 $TARGET 1.3.6.1.2.1.25.6.3.1.2   # Installed software → find vulnerable versions
```

## Leads To

User list from users OID → password-spray. Passwords found in process arguments → try immediately against SSH, SMB, WinRM. Installed software list → match against CVEs in public-exploit. Open ports reveal services missed by a firewalled TCP scan.
