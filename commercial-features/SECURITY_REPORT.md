# Security Report — Commercial Features

- **RBAC Enforcement:** All 8 systems enforce route-level `permission:*` middleware (`system.health.*`, `system.backups.*`, `system.updates.*`, `system.license.*`, `system.support.export`, `system.audit_logs.*`, `customizer.themes.*`, `system.demo.manage`).
- **Demo Mode Guard:** `DemoModeGuard` blocks direct POST/PUT/DELETE requests to sensitive endpoints (`403` for direct/API calls, flash error redirect for Inertia/JSON UI calls).
- **Backup & Restore:** Stored privately in `storage/app/backups/`, SHA-256 checksum verified, `Cache::lock` prevents concurrent restores, pre-restore SQL backup created automatically, path traversal blocked.
- **Support Diagnostic Sanitization:** Deep key + regex redaction removes `APP_KEY`, `API_KEY`, `Bearer` tokens, emails, and passwords.
- **Theme Import Security:** Strict allow-list (`ALLOWED_THEME_KEYS`), hex color regex validation, and explicit rejection of `<script>`, `javascript:`, and `<?php`.
- **Audit Log Immutability:** Eloquent `updating` and `deleting` hooks throw `LogicException`; CSV export escapes spreadsheet formula prefixes.
