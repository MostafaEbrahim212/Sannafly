# Backup & Restore Guide

- **Route:** `/admin/system/backups` (`system.backups.view`, `create`, `download`, `restore`, `delete`)
- **Storage:** Saved privately in `storage/app/backups/` (outside `public/`).
- **Integrity:** Every backup records a SHA-256 checksum in `system_backups` and can be verified before download/restore.
- **Restore Safety:** Acquires `Cache::lock('system_backup_restore')`, verifies checksum, creates a pre-restore safety backup, and restricts SQL statements to DDL/DML.
- **Retention:** Configure max retained backups and apply cleanup from the UI.
