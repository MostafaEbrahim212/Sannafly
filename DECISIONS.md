# Sannafly — System Architecture

## Overview
Sannafly is a modular, monolith-first Laravel + React + TypeScript + Inertia.js platform designed to operate seamlessly in **Catalog Mode** (product browsing, galleries, multi-pricing, variations, inquiries, WhatsApp) and optionally in **E-Commerce Mode** (cart, checkout, orders, customer accounts, payment methods).

## Architectural Principles
1. **Modular Monolith:** Clean separation into domain services (`App\Services\*`), Policies (`App\Policies\*`), Form Requests (`App\Http\Requests\*`), and Inertia React pages (`resources/js/Pages/*`).
2. **Backend-Enforced Authorization:** Every route, Inertia action, bulk operation, export, and import is protected by `permission:` middleware, Laravel Policies, and service-level checks.
3. **Transaction Safety:** Multi-record mutations use `DB::transaction()` with row locking (`lockForUpdate()`) for stock and order operations, keeping external side effects outside DB transactions.
4. **Decimal-Safe Money:** All monetary values use `DECIMAL(15,4)` in the database and string/BCMath arithmetic rather than floating-point numbers.
5. **Bilingual & Bidirectional (EN/AR, LTR/RTL):** Localization and directionality are first-class citizens across Admin, Storefront, and Print views.
6. **Configurable Modules:** E-commerce, stock tracking, reviews, wishlist, brands, comparisons, WhatsApp, variations, and custom pricing can be toggled without breaking unrelated features.

---

## Architecture Decision Records (ADRs)

### ADR-001: Disallow `shipped -> cancelled` order transition
- **Context:** Previously `OrderService::ALLOWED_TRANSITIONS['shipped']` included `'cancelled'`, which called `restoreOrderStock(..., 'release')` even though physical inventory had already left the warehouse with the courier.
- **Decision:** Remove `'cancelled'` from `ALLOWED_TRANSITIONS['shipped']`. Shipped orders can only transition to `'delivered'` or `'returned'` (and from `'returned'` to `'refunded'`).
- **Consequences:** Inventory is only restored for shipped orders when a physical return is recorded (`returned`), preventing phantom stock inflation.

### ADR-002: Actor-Scoped Idempotency Keys
- **Context:** Raw client-supplied `idempotency_key` values were previously stored globally, allowing another client who guessed or replayed a key to fetch someone else's order.
- **Decision:** Hash `"{actor_scope}|{idempotency_key}"` with SHA-256, where `actor_scope` is `customer:{id}` (authenticated) or `session:{id}` (guest). Server-generated session keys are used when the client omits one.
- **Consequences:** Cross-actor key collisions are impossible, and concurrent duplicate submits catch `UniqueConstraintViolationException` and return the existing order safely.

### ADR-003: Non-Sequential, High-Entropy Order Numbers
- **Context:** Short 6-character suffixes on `ORD-YYYYMMDD-XXXXXX` are easier to enumerate.
- **Decision:** Use `ORD-YYYYMMDD-{10-char CSPRNG}` (`Str::random(10)` uppercase) with uniqueness collision retry, paired with ownership/session/signed-URL authorization on `/orders/confirmation/{orderNumber}`.
- **Consequences:** Order numbers remain human-readable for support and Fawry/MyFatoorah references while resisting enumeration.
