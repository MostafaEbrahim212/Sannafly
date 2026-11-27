# Demo Mode Guide

- **Configuration:** Enable via `APP_DEMO_MODE=true` in `.env` or `POST /admin/system/demo/toggle` (`system.demo.manage`).
- **Backend Enforcement:** `DemoModeGuard` middleware blocks destructive/system-critical mutations (backups, restore, updates, license changes, user/role deletion) even on direct API requests.
- **Demo Reset:** `POST /admin/system/demo/reset` re-seeds `DemoCatalogSeeder` ONLY when Demo Mode is explicitly active.
