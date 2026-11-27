# Demo Mode Audit Report

## 1. Current Implementation Overview
The existing Demo Mode is built on a modular Laravel + Inertia.js + React architecture:
- **`App\Services\DemoModeService`**: Checks `APP_DEMO_MODE` env flag or `demo_mode_enabled` setting (`settings` table). Provides `setEnabled(bool)`, `ensureDemoAccount()`, and `resetDemoData()`.
- **`App\Http\Controllers\Admin\DemoModeController`**: Serves `/demo` (`hub()`), handles one-click reviewer sign-in (`POST /demo/login-admin` with `throttle:10,1` and `session()->regenerate()`), and provides admin `toggle()` and `reset()`.
- **`App\Http\Middleware\DemoModeGuard` (`demo.guard`)**: Intercepts mutating requests when `DemoModeService::isEnabled()` is true, returning `back()->with('error', ...)` for Inertia/JSON requests or HTTP `403` for standard requests.
- **`demo-reviewer` Role (`demo@example.com`)**: Automatically created/synced with a random 32-character password and read-only permissions (`dashboard.access`, `products.view`, `categories.view`, `inventory.view`, `orders.view`, `reports.view`, `audit_logs.view`, `system.audit_logs.view`, `customizer.themes.view`).
- **`Database\Seeders\DemoCatalogSeeder`**: Uses `updateOrCreate` on known sample SKUs (`CF-*`), categories, brands, attributes, coupons, and shipping zones.
- **`CartCheckoutController`**: Skips external online payment gateway calls (`myfatoorah`, `fawry`, `paymob`, `kashier`) when Demo Mode is active and redirects to order confirmation with a simulated preview notice.
- **Shared Prop (`HandleInertiaRequests`)**: Exposes `demoMode` (`boolean`) to all Inertia pages.

## 2. Existing Strengths to Reuse
- Clean server-side RBAC enforcement via `CheckPermission` and `demo-reviewer` least-privilege role.
- Throttled one-click sign-in (`throttle:10,1`) with random unguessable password and session regeneration.
- Non-destructive `DemoCatalogSeeder` (`updateOrCreate` on sample records rather than `truncate()`).
- Safe online payment bypass in `CartCheckoutController`.

## 3. Current Limitations, Security & Isolation Risks
1. **Shared Database Architecture (Critical Architectural Constraint):**
   - Enabling Demo Mode on a live production database shares the same tables (`orders`, `products`, `settings`) with real data.
   - Real administrators are also restricted by `demo.guard` while Demo Mode is active globally.
   - **Recommendation:** Production deployments should run Demo Mode on a **dedicated demo instance/database**, never on a live store with real customer data.
2. **Missing `demo.guard` on Additional Mutating Routes:**
   - `coupons.*`, `shipping-zones.*`, `policies.update`, `reviews.*`, `inquiries.status`, `customers.toggle`, `orders.status`, `products.store/update/bulk/images`, `categories.store/update`, `brands.store/update`, and `attributes.*` lacked `demo.guard` for non-reviewer sessions.
3. **Demo UX & Transparency Gaps:**
   - No persistent **Demo Mode Banner** in `AdminLayout` or `StorefrontLayout` indicating Demo Mode, active `demo-reviewer` session, restricted actions, or quick exit/return to `/demo`.
   - No **Guided Demo Tour** inside the dashboard.
   - `/demo` lacked a full feature overview, guided tour introduction, and explicit simulated-operations / limitations breakdown.
   - Storefront `/cart` and `/orders/confirmation/{orderNumber}` needed clearer visual simulated-payment notices when `demoMode` is active.
4. **Reset Safeguards:**
   - `resetDemoData()` safely re-seeds only `DemoCatalogSeeder` sample records, but `POST /admin/system/demo/reset` lacked explicit throttling and `/demo` did not display reset/isolation details.
