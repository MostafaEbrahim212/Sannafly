# Developer Guide

## Architecture
- **Backend:** Laravel 13 (`app/Services/` for domain logic: `OrderService`, `InventoryService`, `ShippingService`, `SettingsService`, `InstallerService`, `LicenseService`, `DatabaseBackupService`, `RealtimeNotificationService`).
- **Frontend:** React 19 + TypeScript + Inertia.js 3 + Tailwind CSS 4 (`resources/js/Pages/`, `resources/js/Layouts/`, `resources/js/Components/`).
- **Money Arithmetic:** All monetary values use `DECIMAL(15,4)` and `BCMath` via `App\Support\Money` (zero float arithmetic).
- **Authorization:** Dual-guard (`web` for admins, `customer` for shoppers) with granular RBAC (`CheckPermission` middleware + Policies).

## Useful Commands
```bash
php artisan test --exclude-group=mysql   # Run Pest test suite
./vendor/bin/pint --test                 # Code style check
npx tsc --noEmit                         # TypeScript check
npm test                                 # Vitest frontend unit & a11y tests
npm run build                            # Production Vite build
```
