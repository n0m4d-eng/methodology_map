---
id: htb-forest
title: "HTB - Forest"
platform: HackTheBox
os: Windows
difficulty: Easy
date: 2024-01-10
tags: [windows, ad, asreproast, dcsync, acl-abuse]
attack_path:
  - nmap-scan
  - ldap-enum
  - asreproast
  - winrm
  - acl-abuse
  - dcsync
  - domain-admin
---

## Path Summary

1. **Nmap** — ports 53, 88, 135, 389, 445, 5985, 9389. Windows DC confirmed via Kerberos + LDAP.
2. **LDAP anonymous bind** — enumerated all users. Found `svc-alfresco` with `DONT_REQ_PREAUTH`.
3. **AS-REP Roasting** — got the hash for `svc-alfresco`, cracked with hashcat in ~2 minutes.
4. **WinRM** — landed a shell as `svc-alfresco`.
5. **BloodHound** — `svc-alfresco` is in `Service Accounts` → `Privileged IT Accounts` → `Account Operators`. Account Operators can add users to `Exchange Windows Permissions`. That group has `WriteDACL` on the domain.
6. **WriteDACL abuse** — added self to `Exchange Windows Permissions`, granted DCSync rights.
7. **DCSync** — dumped all hashes including `Administrator`.
8. **Pass-the-Hash** as Administrator → Domain Admin.
