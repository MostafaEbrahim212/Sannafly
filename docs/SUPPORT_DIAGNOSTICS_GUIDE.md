# Support Diagnostics Guide

- **Route:** `/admin/system/support` (`system.support.export`)
- **Formats:** JSON, Markdown TXT, and ZIP (`diagnostics.json` + `diagnostics.md`).
- **Sanitization:** `SupportDiagnosticService::sanitizeRecursive()` strips sensitive keys (`password`, `secret`, `token`, `api_key`, `app_key`, `hmac`, `session`, `cookie`) and regex-redacts `base64:` keys, `Bearer` tokens, API keys, and email addresses.
