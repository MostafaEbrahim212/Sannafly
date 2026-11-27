# Audit Log Guide

- **Route:** `/admin/system/audit-logs` (`system.audit_logs.view`, `system.audit_logs.export`)
- **Immutability:** `AuditLog` model blocks `updating()` and `deleting()` via `LogicException`.
- **Tracking:** Records actor, action, `event_type`, `result`, subject, IP, user agent, `request_id`, and sanitized old/new values.
- **Export:** Filtered CSV export with spreadsheet formula-injection protection.
