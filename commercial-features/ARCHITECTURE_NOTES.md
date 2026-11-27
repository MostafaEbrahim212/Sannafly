# Architecture & Security Notes

- **Separation of Concerns:** Controllers delegate all business, crypto, checksum, backup, and sanitization logic to dedicated Services (`SystemHealthService`, `DatabaseBackupService`, `UpdateService`, `LicenseService`, `SupportDiagnosticService`, `ThemePresetService`, `DemoModeService`).
- **Immutability & Integrity:** `AuditLog` enforces immutability at the Eloquent model layer (`LogicException`). `SystemBackup` tracks SHA-256 checksums and acquires `Cache::lock` during restore.
- **No Fake Data:** `UpdateService` and `LicenseService` clearly distinguish offline/self-hosted mode from remote server verification.
- **Demo Mode Enforcement:** Enforced at the route middleware level (`DemoModeGuard`) and service level (`DemoModeService::resetDemoData()`).
