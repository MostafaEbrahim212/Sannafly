# Security Report

- **Installer Lock:** Dual lock via `storage/installed` + DB check for existing `super-admin` user (`EnsureNotInstalled` returns 404). `InstallerController::createOwner` additionally blocks duplicate owner creation.
- **Environment Protection:** `.env` writes create timestamped backups in `storage/app/.env.backup.*`; secrets are excluded from diagnostic reports and release packages.
- **Backup & Restore Security:** Backups stored outside `public/` in `storage/app/backups/`; filenames validated via `basename()` + `realpath()` containment; SQL restore restricts statements to DDL/DML (`SET FOREIGN_KEY_CHECKS`, `DROP TABLE`, `CREATE TABLE`, `INSERT INTO`).
- **Licensing Security:** License payloads encrypted at rest using Laravel `Crypt::encryptString()`; 14-day offline grace period prevents sudden outage if remote license server is unreachable; no remote code execution.
- **Payment Security:** Gateway credentials stored in DB `payment_methods.config`; callbacks excluded from CSRF only on `payments/callback/*` and verified via provider HMAC/API lookup with BCMath amount/currency checks.
- **RBAC & Auth:** Dual-guard (`web` and `customer`), `CheckPermission` middleware, rate limiting on auth, checkout, inquiries, and installer routes.
