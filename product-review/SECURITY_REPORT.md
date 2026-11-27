# Security Report

## 1. Access Control & Authentication
- **Dual Guard Isolation:** Admin/staff authentication (`web` guard) is separated from customer authentication (`customer` guard). Customers receive `403` on admin routes (verified in `ThemedErrorPagesTest.php`).
- **Granular RBAC:** Permissions are enforced via `CheckPermission` middleware and policies.
- **Demo Reviewer Least Privilege:** When Demo Mode is active, `demo@example.com` is restricted to the `demo-reviewer` role with read-only permissions (`dashboard.access`, `products.view`, `categories.view`, `inventory.view`, `orders.view`, `reports.view`, `audit_logs.view`, `system.audit_logs.view`, `customizer.themes.view`). Access to `/admin/system/backups`, `/admin/system/license`, `/admin/system/support`, `/admin/users`, `/admin/payment-methods`, and `/admin/settings` returns `403`.

## 2. Demo Mode Protection (`DemoModeGuard`)
- `App\Http\Middleware\DemoModeGuard` (`demo.guard`) intercepts sensitive mutating routes whenever `DemoModeService::isEnabled()` is true:
  - Returns `back()->with('error', ...)` for Inertia/JSON requests.
  - Returns `403 Forbidden` for standard HTTP requests.
- Protected routes include settings updates, payment method configuration updates, system log clearing/deletion, and catalog deletions (`products.destroy`, `categories.destroy`, `brands.destroy`).
- `POST /demo/login-admin` is rate-limited (`throttle:10,1`) and returns `403` when Demo Mode is disabled.

## 3. Payment & Data Safety
- Online payment drivers (`myfatoorah`, `fawry`, `paymob`, `kashier`) are bypassed in `CartCheckoutController` during Demo Mode so no external gateway API calls or live charges are triggered.
- Security headers middleware (`SecurityHeaders.php`) and custom CSS/JS sanitization are active in the application pipeline.
