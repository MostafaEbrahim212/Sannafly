# System Health & Diagnostics Guide

- **Route:** `/admin/system/health` (`system.health.view`, `system.health.run`)
- **Checks:** Database connectivity & core tables, Storage writability & disk space, PHP version & extensions, Application `APP_KEY` & Cache, Mail driver + safe Test Email, Queue & Cron diagnostics, Security (`APP_DEBUG`, HTTPS, Install Lock).
- **Statuses:** `passed`, `warning`, `failed`, `not_applicable` with execution time and actionable remediation tips.
