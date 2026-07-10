---
id: ftp-enum
title: FTP Enumeration
stage: enumeration
tags: [windows, linux, ftp]
tools:
  - nmap -Pn -sV -p 21 --script="ftp*" $TARGET
  - ftp $TARGET
  - wget -r --no-passive ftp://anonymous:@$TARGET/
  - hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ftp://$TARGET
leads_to:
  - public-exploit
  - file-upload-shell
---

## Anonymous Login (try first)

```bash
ftp $TARGET
# username: anonymous
# password: anonymous (or blank)

# Check for anonymous write
put test.txt

# Recursive download
wget -r --no-passive ftp://anonymous:@$TARGET/
lftp -e "set ftp:ssl-allow no; ls; exit" $TARGET
```

## Brute Force

```bash
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ftp://$TARGET
medusa -h $TARGET -U users.txt -P passwords.txt -M ftp
```

## Notes

If anonymous write is enabled and the FTP root overlaps with the web root, you can upload a web shell. Check if the FTP path is under `/var/www/html` or equivalent.

FTP version from banner grab → searchsploit for known exploits (vsftpd 2.3.4 backdoor, ProFTPD mod_copy RCE).
