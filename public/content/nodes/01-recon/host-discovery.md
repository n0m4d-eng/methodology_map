---
id: host-discovery
title: Host Discovery
stage: recon
tags: [windows, linux]
summary: Enumerate live hosts on a network segment — run this when you land on a pivot host and discover a new subnet.
leads_to:
  - nmap-scan
---

## Prerequisites

Network access to the subnet, either direct or via a pivot host. Run `ip route` and `arp -a` on a compromised host to find subnets first.

Host discovery tells you which IPs are actually alive before you spend time scanning. ICMP (ping sweeps) is fast but often blocked; ARP is the most reliable on the local segment and can't be filtered. On a pivot, use proxychains with TCP-based checks since ICMP won't traverse SOCKS.

## Quick Win

> ARP scan — works even when ICMP is blocked, fastest on local segment.

```bash
arp-scan --localnet
```

## ICMP Ping Sweep

> Standard ping sweep — fast but blocked by host-based firewalls on many Windows targets.

```bash
nmap -sn 192.168.1.0/24
fping -ag 192.168.1.0/24 2>/dev/null
netdiscover -r 192.168.1.0/24
```

## TCP Ping (when ICMP is blocked)

> Probes common ports instead of ICMP — gets through most firewalls.

```bash
nmap -sn -PS 80,443,22,21 192.168.1.0/24
```

## Through a Pivot

> Proxychains forces TCP connect — SYN scan (-sS) doesn't work over SOCKS.

```bash
proxychains nmap -Pn -sT 10.10.10.0/24
```

## Leads To

Feed every live IP into nmap-scan. Prioritise IPs that responded to ARP but not ICMP — those are likely Windows hosts with firewalls up, and they're still running services.
