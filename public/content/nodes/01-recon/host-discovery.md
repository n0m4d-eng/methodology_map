---
id: host-discovery
title: Host Discovery
stage: recon
tags: [windows, linux]
tools:
  - nmap -sn 192.168.1.0/24
  - fping -ag 192.168.1.0/24 2>/dev/null
  - arp-scan --localnet
  - netdiscover -r 192.168.1.0/24
leads_to:
  - nmap-scan
---

## Methods

```bash
# Ping sweep (ICMP)
nmap -sn 192.168.1.0/24

# ARP (local network only — most reliable on-segment)
arp-scan --localnet
netdiscover -r 192.168.1.0/24

# fping
fping -ag 192.168.1.0/24 2>/dev/null

# When ICMP is blocked (TCP ping)
nmap -sn -PS 80,443,22,21 192.168.1.0/24

# Through a pivot (proxychains)
proxychains nmap -Pn -sn 10.10.10.0/24
```

## Notes

Run host discovery when you land on a pivot host and find a new subnet via `ip route` or `arp -a`. Feed all live hosts into nmap-scan.
