---
id: ssh-access
title: SSH Access
stage: foothold
tags: [linux, ssh]
summary: Authenticate to SSH with a password, private key, or brute-forced credential — the most stable and interactive Linux foothold available.
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

## Prerequisites

Port 22 open. Valid credentials, a private key found during enumeration (LFI, share access, file read), or a username list for brute force. SSH is rarely brute-forced directly — most SSH footholds come from credentials found elsewhere.

SSH gives a fully interactive, encrypted terminal — no TTY upgrade needed, tab completion and job control work out of the box. It's the best Linux foothold when available. Private keys found during recon (`/root/.ssh/id_rsa`, SYSVOL shares, backup files) often give direct root access without any cracking.

## Quick Win

> Try private key auth first — keys found during recon frequently grant immediate root access.

```bash
chmod 600 id_rsa
ssh -i id_rsa root@$TARGET
ssh -i id_rsa user@$TARGET
```

## Connect

> Standard password auth and private key variants — try non-standard ports if 22 is filtered.

```bash
ssh user@$TARGET
ssh -i id_rsa user@$TARGET
ssh -i id_rsa -p 2222 user@$TARGET
```

## Brute Force

> Last resort — high lockout risk. Only use when you have no other path.

```bash
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ssh://$TARGET -t 4
medusa -h $TARGET -U users.txt -P passwords.txt -M ssh
```

## After Landing

> Run all of these immediately before doing anything else — covers the top Linux privesc paths.

```bash
id && whoami && hostname
sudo -l
find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null
cat /etc/crontab && ls -la /etc/cron.*
ss -anp
cat ~/.bash_history
cat ~/.ssh/id_rsa 2>/dev/null
```

## Leads To

`sudo -l` output → check GTFOBins for each entry → linux-sudo. SUID binaries found → linux-suid-caps. Cron jobs writing to world-writable paths → linux-cron. Internal ports found via `ss -anp` → pivot to additional services. SSH keys for other hosts found in `~/.ssh/` → repeat SSH access laterally.
