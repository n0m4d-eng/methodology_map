---
id: snmp-enum
title: SNMP Enumeration
stage: enumeration
tags: [windows, linux]
tools:
  - onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt $TARGET
  - snmpwalk -c public -v2c $TARGET
  - snmp-check $TARGET -c public
leads_to:
  - password-spray
---

## Community String Brute

```bash
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt $TARGET
```

## Walk Once String Known

```bash
snmpwalk -c public -v2c $TARGET
snmpwalk -c public -v1 -t 10 $TARGET

# Formatted output
snmp-check $TARGET -c public
```

## Windows-Specific OIDs

```bash
snmpwalk -c public -v1 $TARGET 1.3.6.1.4.1.77.1.2.25    # Local users
snmpwalk -c public -v1 $TARGET 1.3.6.1.2.1.25.4.2.1.2   # Running processes
snmpwalk -c public -v1 $TARGET 1.3.6.1.2.1.6.13.1.3     # Open TCP ports
snmpwalk -c public -v1 $TARGET 1.3.6.1.2.1.25.6.3.1.2   # Installed software
```

## Notes

SNMP runs on UDP 161 — it won't appear in TCP scans. The users OID often leaks valid domain usernames for spraying.
