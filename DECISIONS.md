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
