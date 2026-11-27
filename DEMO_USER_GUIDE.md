# Demo User Guide

## 1. How the Demo Works
The platform provides an interactive, bilingual (AR/EN, RTL/LTR) demonstration experience powered by:
- **`/demo` (`Demo/Index.tsx`)**: Public demonstration portal with Storefront and Admin Demo entry points, verified feature overview, guided tour intro, and limitations disclosure.
- **`demo-reviewer` Role (`demo@example.com`)**: Automatically created with a random 32-character password and least-privilege read/preview permissions.
- **`DemoModeGuard` (`demo.guard`)**: Server-side middleware blocking mutating operations across settings, payments, products/categories/brands, coupons, shipping zones, policies, reviews, inquiries, customers, orders, users/roles, backups, updates, license, and theme presets.
- **Guided Demo Tour (`DemoTour.tsx`)**: Persistent Demo Mode banner + 8-step interactive tour inside the Admin Dashboard.

## 2. How to Enable & Disable Demo Mode
- **Via Admin UI:** Open `/admin/system-tools` and toggle Demo Mode on/off.
- **Via Environment:** Set `APP_DEMO_MODE=true` in `.env` (for dedicated demo servers).
- **Via CLI:**
  ```sh
  php artisan tinker --execute="app(\App\Services\DemoModeService::class)->setEnabled(true);"
  php artisan tinker --execute="app(\App\Services\DemoModeService::class)->setEnabled(false);"
  ```

## 3. How Visitors Explore the Demo
- **Storefront (`/`, `/catalog`, `/cart`):** Browse products, switch AR/EN and Dark/Light mode, add items to cart, apply coupons, and test checkout. A top amber banner links back to `/demo`.
- **Admin Dashboard (`/demo` → `Enter Demo Dashboard + Guided Tour`):** Signs into a regenerated `web` session as `demo-reviewer`. Visitors can inspect `/admin`, `/admin/products`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/analytics`, `/admin/customizer/themes`, and `/admin/system/audit-logs`, and step through the 8-step Guided Tour.

## 4. What Visitors Cannot Do (Enforced Server-Side)
- Cannot access `/admin/settings`, `/admin/payment-methods`, `/admin/users`, `/admin/roles`, `/admin/system/backups`, `/admin/system/updates`, `/admin/system/license`, or `/admin/system/support` (`403 Forbidden`).
- Cannot mutate settings, delete records, change order statuses, or reset demo data.

## 5. Simulated Checkout & Payment
- When `demoMode` is active, `/cart` and `/orders/confirmation/{orderNumber}` display clear simulated-payment notices.
- `CartCheckoutController` bypasses live gateway APIs (`myfatoorah`, `fawry`, `paymob`, `kashier`) so zero real money is charged.

## 6. Demo Reset & Isolation Precautions
- **Demo Reset (`POST /admin/system/demo/reset`)**: Throttled (`throttle:5,1`), restricted to `system.demo.manage`, blocked when Demo Mode is disabled, and runs `DemoCatalogSeeder` (`updateOrCreate` on sample `CF-*` records).
- **Deployment Best Practice:** Always host public demos on a **dedicated demo instance and database** separate from live production customer stores, and keep Demo Mode **OFF** on real customer deployments.
