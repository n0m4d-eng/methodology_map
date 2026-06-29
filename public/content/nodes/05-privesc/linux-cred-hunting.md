---
id: linux-cred-hunting
title: Linux Credential Hunting
stage: privesc
tags: [linux]
tools:
  - find / -name "*.conf" 2>/dev/null | xargs grep -li "password" 2>/dev/null
  - cat ~/.bash_history
  - find / -name "id_rsa" -o -name "id_ecdsa" 2>/dev/null
leads_to:
  - linux-sudo
  - root-linux
  - ssh-access
---

## Config Files

```bash
find / -name "*.conf" -o -name "*.config" -o -name "*.ini" 2>/dev/null \
  | xargs grep -li "password" 2>/dev/null

find / -name ".env" 2>/dev/null | xargs cat 2>/dev/null
find / -name "wp-config.php" 2>/dev/null | xargs cat 2>/dev/null

# Web app configs (usually contain DB passwords)
grep -rn "password" /var/www/ 2>/dev/null | grep -v ".pyc" | head -30
grep -rn "password" /opt/ 2>/dev/null | head -20
```

## Shell History

```bash
cat ~/.bash_history
cat ~/.zsh_history
cat ~/.mysql_history
cat ~/.python_history
cat /root/.bash_history 2>/dev/null
```

## SSH Keys

```bash
find / -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null
find / -name "*.pem" -o -name "*.key" 2>/dev/null
cat ~/.ssh/id_rsa 2>/dev/null
```

## Database Files

```bash
find / -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null
```

## Notes

Database passwords in web configs are often reused as system user passwords or SSH credentials. SSH keys found anywhere can give access to other hosts in the network. Always spray any credentials found against all known services immediately.
