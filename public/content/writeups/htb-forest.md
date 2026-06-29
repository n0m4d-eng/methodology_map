---
title: HTB - Forest
date: 2024-01-10
platform: HTB
difficulty: easy
os: windows
tags:
  - ctf
  - windows
  - htb
  - active-directory
  - ldap-enumeration
  - as-rep-roasting
  - acl-abuse
  - dcsync
  - winrm
  - pass-the-hash
attack_path:
  - nmap-scan
  - ldap-enum
  - asreproast
  - winrm
  - acl-abuse
  - dcsync
  - domain-admin
summary: "LDAP null auth exposed all users → AS-REP roasted svc-alfresco → BloodHound WriteDACL chain → DCSync → domain admin"
key_techniques:
  - AS-REP Roasting (Kerberos pre-auth disabled)
  - BloodHound ACL chain discovery
  - WriteDACL abuse to grant DCSync rights
  - Pass-the-Hash as Administrator
---

# Scope

_10.10.10.161_

# Enumeration

## Port Scan

```
PORT      STATE SERVICE
53/tcp    open  domain
88/tcp    open  kerberos-sec
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
389/tcp   open  ldap
445/tcp   open  microsoft-ds
464/tcp   open  kpasswd5
593/tcp   open  http-rpc-epmap
636/tcp   open  ldapssl
3268/tcp  open  globalcatLDAP
3269/tcp  open  globalcatLDAPssl
5985/tcp  open  wsman
9389/tcp  open  adws
```

## Initial Hypothesis

- Full AD Domain Controller — Kerberos (88), LDAP (389), SMB (445), WinRM (5985), ADWS (9389).
- No HTTP/HTTPS — attack surface is purely AD/Kerberos/SMB.
- WinRM on 5985 means a shell is available if valid credentials are obtained.
- Key areas to test: LDAP null/anonymous bind, AS-REP roasting on any users with pre-auth disabled.

## Findings

- Domain: `htb.local`
- Domain Controller: `FOREST.htb.local`

## LDAP

_Playbook: 06_active_directory.md — Phase 1 (LDAP null bind, user enum)_

LDAP allowed anonymous bind, exposing all domain users. Notable account found: `svc-alfresco` — a service account with `DONT_REQ_PREAUTH` set (AS-REP roastable).

# Exploit

## AS-REP Roasting

_Playbook: 06_active_directory.md — Phase 2 (AS-REP Roasting)_

`svc-alfresco` had Kerberos pre-authentication disabled. An AS-REP hash was requested without credentials and cracked offline with hashcat in under two minutes.

```
$krb5asrep$23$svc-alfresco@HTB.LOCAL:<hash>
```

Password cracked: `s3rvice`

## WinRM

_Playbook: 06_active_directory.md — Phase 6 (evil-winrm)_

```bash
evil-winrm -i 10.10.10.161 -u svc-alfresco -p s3rvice
```

Shell obtained as `htb\svc-alfresco`.

# Internal Enumeration

## BloodHound

_Playbook: 06_active_directory.md — Phase 3 (BloodHound Collection)_

SharpHound was run and the output ingested into BloodHound. `svc-alfresco` marked as owned.

Attack chain discovered:

- `svc-alfresco` → member of `Service Accounts`
- `Service Accounts` → member of `Privileged IT Accounts`
- `Privileged IT Accounts` → member of `Account Operators`
- `Account Operators` → can add members to `Exchange Windows Permissions`
- `Exchange Windows Permissions` → has `WriteDACL` on the domain object

# Privilege Escalation

## WriteDACL → DCSync

_Playbook: 06_active_directory.md — Phase 5 (ACL Abuse — WriteDACL, DCSync)_

A new user was created and added to `Exchange Windows Permissions`. `WriteDACL` on the domain object was then used to grant `DS-Replication-Get-Changes` and `DS-Replication-Get-Changes-All` — the two rights required for DCSync.

```bash
Add-DomainObjectAcl -TargetIdentity "DC=htb,DC=local" -PrincipalIdentity <user> -Rights DCSync
```

DCSync was run via secretsdump, dumping all hashes including `Administrator`.

```bash
secretsdump.py htb.local/<user>:<pass>@10.10.10.161
```

Pass-the-Hash as Administrator:

```bash
evil-winrm -i 10.10.10.161 -u administrator -H <ntlm_hash>
```

# Remediation

- **LDAP anonymous bind**: Disable null/anonymous LDAP bind on the domain controller. No external user should be able to enumerate accounts without authenticating.
- **AS-REP roasting**: Enable Kerberos pre-authentication on all accounts. Only disable it when a specific legacy application requires it, and only for that specific account.
- **Account Operators + Exchange Windows Permissions**: The `Exchange Windows Permissions` group having `WriteDACL` over the domain is a known post-installation artefact from Exchange. Remove the ACE or apply the mitigation from Microsoft's advisory.
- **Service account privilege creep**: `svc-alfresco` had no need to be in the chain that ultimately reaches `WriteDACL` on the domain. Audit group membership for service accounts and apply least-privilege.

# Lessons Learnt

- **LDAP null bind is a full user enumeration primitive.** In an AD environment without explicit lockdown, an unauthenticated attacker can retrieve every account name, making targeted AS-REP roasting and password spraying trivial.
- **AS-REP roasting requires zero credentials.** If any account in the domain has pre-auth disabled, an offline hash is recoverable without alerting the domain.
- **BloodHound ACL chains are non-obvious.** No single hop in this chain looks dangerous in isolation — it took four group memberships and one ACE to reach DCSync. Always run BloodHound before concluding there is no privesc path.
- **Exchange post-install ACEs persist.** The `WriteDACL` ACE on the domain granted to `Exchange Windows Permissions` is a documented Exchange installation side-effect. It must be explicitly removed; it will not disappear when Exchange is patched or removed.
