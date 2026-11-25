# Security Architecture

## Authentication & Session Security
- Bcrypt/Argon2id password hashing with rate-limited login (`5 attempts/min` per email+IP + route `throttle:10,1`).
- `EnsureUserIsActive` enforces `active` status on every authenticated admin request.
- Session IDs regenerate on login and logout to prevent session fixation.

## Authorization (RBAC)
- Granular `resource.action` permissions enforced via `CheckPermission` (`permission:` middleware) and Laravel Policies (`ProductPolicy`, `UserPolicy`).
- `CheckPermission` explicitly resolves the `web` guard `User` model (`instanceof User`) so `Customer` sessions cannot trigger admin role checks.
- Role and user editors prevent non-super-admins from granting/revoking `super-admin`, escalating permissions they do not hold, or removing/deactivating the last active `super-admin`.

## Order Confirmation, Tracking & Abuse Protection
- `/orders/confirmation/{orderNumber}` authorizes only the owning `customer`, the originating session (`placed_order_numbers`), or a valid temporary signed URL; otherwise returns `404`.
- Public order responses use a strict allow-listed DTO; `Payment::$hidden` hides `payload` and `idempotency_key`, `Order::$hidden` hides `idempotency_key`, and `PaymentMethod::$hidden` hides encrypted `config`.
- `/track-order` is rate-limited per IP and per `order_number`, normalizes Egyptian phone formats, and compares with `hash_equals`.
- `/cart/add`, `/cart/coupon`, `/checkout`, `/inquiries`, and `/products/{product}/reviews` are protected by `throttle:` middleware, and coupons support `usage_limit_per_customer` via `coupon_redemptions`.

## Immutable Audit Logging
- `AuditLog` throws `LogicException` on `updating`/`deleting` events.
- Migration `2026_01_01_000010_add_audit_log_immutability_triggers` installs SQLite/MySQL `BEFORE UPDATE` and `BEFORE DELETE` triggers on `audit_logs`.
- `AuditLogger` redacts sensitive keys (`password`, `token`, `secret`, `security_key`, `api_key`, `private_key`, `config`, etc.) and defers transactional logs via `DB::afterCommit` in non-test environments.

## HTTP Security Headers
- Configured in `config/security.php` and enforced by `SecurityHeaders`:
  - `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Content-Security-Policy-Report-Only` (switchable to enforcing via `SECURITY_CSP_REPORT_ONLY=false`)
  - `Strict-Transport-Security` (only on HTTPS requests in `production`)
