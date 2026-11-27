# Live Demo Environment Report

## 1. Overview
A sandboxed Live Demo Hub has been implemented at `GET /demo` (`demo.hub`, Inertia component `resources/js/Pages/Demo/Index.tsx`) to let prospective buyers explore both the storefront and the admin dashboard safely.

## 2. Implemented Components
- **Controller:** `App\Http\Controllers\Admin\DemoModeController`
  - `hub()`: Renders `Demo/Index` with `demoMode` status.
  - `loginAsDemo()`: Validates `DemoModeService::isEnabled()` (returns `403` if disabled), ensures the `demo@example.com` account exists via `ensureDemoAccount()`, logs into the `web` guard, and redirects to `/admin`.
- **Route:**
  - `GET /demo` (`demo.hub`)
  - `POST /demo/login-admin` (`demo.login-admin`, `throttle:10,1`)
- **Service:** `App\Services\DemoModeService`
  - Manages `DEMO_EMAIL = 'demo@example.com'`.
  - Automatically provisions and syncs the restricted `demo-reviewer` role when `setEnabled(true)` is called.
- **Admin Login Integration:** `resources/js/Pages/Auth/Login.tsx` displays a one-click "Demo Reviewer Login" card when `demoMode` is active.
- **Simulated Checkout:** `App\Http\Controllers\CartCheckoutController` simulates confirmation for online payment drivers when Demo Mode is enabled.

## 3. UI & Localization
- `resources/js/Pages/Demo/Index.tsx` supports Arabic (RTL) and English (LTR) plus Dark/Light mode toggling, guiding visitors to the Storefront (`/`), Product Landing Page (`/product`), and one-click Admin Demo Reviewer session (`/demo/login-admin`).
