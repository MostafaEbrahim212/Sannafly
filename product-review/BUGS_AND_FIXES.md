# Bugs and Fixes Log

## 1. Security & Demo Mode Hardening Fixes
1. **Missing `demo.guard` on Sensitive Admin Mutating Routes**
   - **Location:** `routes/web.php`
   - **Issue:** Destructive or configuration-mutating routes (`system-logs.clear`, `system-logs.destroy`, `settings.update`, `payment-methods.update`, `products.destroy`, `categories.destroy`, `brands.destroy`) could be executed when Demo Mode was active.
   - **Fix:** Applied `demo.guard` middleware (`App\Http\Middleware\DemoModeGuard`) to all listed routes.

2. **Missing Dedicated Restricted Demo Reviewer Account**
   - **Location:** `app/Services/DemoModeService.php`, `app/Http/Controllers/Admin/DemoModeController.php`, `resources/js/Pages/Auth/Login.tsx`
   - **Issue:** Visitors evaluating the admin panel lacked an isolated, non-privileged reviewer role, risking over-privileged demo access or manual credential sharing.
   - **Fix:** Added `DemoModeService::DEMO_EMAIL` (`demo@example.com`) and `ensureDemoAccount()` creating/syncing the `demo-reviewer` role with read-only permissions (`dashboard.access`, `products.view`, `categories.view`, `inventory.view`, `orders.view`, `reports.view`, `audit_logs.view`, `system.audit_logs.view`, `customizer.themes.view`). Added throttled `POST /demo/login-admin` (`throttle:10,1`) and one-click Demo Reviewer login button on `Auth/Login.tsx` when `demoMode` is enabled.

3. **Online Payment Gateway Calls During Demo Mode**
   - **Location:** `app/Http/Controllers/CartCheckoutController.php`
   - **Issue:** Selecting an online gateway (`myfatoorah`, `fawry`, `paymob`, `kashier`) during Demo Mode could attempt live gateway initialization.
   - **Fix:** Added a Demo Mode check in `CartCheckoutController` that skips real gateway API calls when `DemoModeService::isEnabled()` is true and redirects to the order confirmation page with a simulated preview notice.

## 2. Test & Environment Fixes
1. **Demo Guard Test Assertion Alignment**
   - **Location:** `tests/Feature/LandingAndDemoTest.php`
   - **Issue:** Initial test used `RolePermissionSeeder` (actual seeder is `RbacSeeder`), `$admin->assignRole()` (actual relation is `$admin->roles()->sync()`), and expected redirect without `X-Inertia` header (`DemoModeGuard` returns `403` for non-JSON/non-Inertia requests and `back()->with('error', ...)` for Inertia/JSON requests).
   - **Fix:** Updated `tests/Feature/LandingAndDemoTest.php` to use `RbacSeeder`, `roles()->sync()`, and verify both HTTP `403` (standard POST) and Inertia redirect with error flash (`X-Inertia: true`).
