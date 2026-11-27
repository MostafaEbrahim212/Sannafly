# Sales Demo Security Report

## 1. Presenter Notes Isolation (Server-Side)
- `DemoModeController::presentation()` checks `Auth::guard('web')->user()` and verifies the user does **not** hold the `demo-reviewer` role (`$isPresenter`).
- For public visitors and `demo-reviewer` sessions, `presenterNotes` is returned as `null` from the server — presenter notes are **not** stored in client-side JS data files (`salesPresentationData.ts`) and cannot be read by inspecting public page props or JS bundles.

## 2. Demo Account & RBAC Isolation
- `demo@example.com` (`demo-reviewer`) is generated with a random 32-character password and read/preview permissions only.
- `POST /demo/login-admin` is rate-limited (`throttle:10,1`), regenerates the session, and aborts `403` when Demo Mode is disabled.
- Customer guard (`customer`) and Admin guard (`web`) remain strictly separated.

## 3. Data & Payment Protection
- `DemoModeGuard` (`demo.guard`) protects settings, payment methods, coupons, shipping zones, policies, reviews, inquiries, customers, orders, products/categories/brands mutations, users/roles deletion, backups, updates, license, and theme presets.
- Online payment drivers (`myfatoorah`, `fawry`, `paymob`, `kashier`) are bypassed in `CartCheckoutController` during Demo Mode so no real charges or external gateway calls occur.
- `POST /admin/system/demo/reset` is throttled (`throttle:5,1`), requires `system.demo.manage`, is blocked when Demo Mode is disabled, and uses `DemoCatalogSeeder` (`updateOrCreate` on sample `CF-*` data).
