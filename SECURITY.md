# Sannafly — Architectural Decisions Record

## ADR-001: Temporary Project Name
- **Decision:** Use `Sannafly` (`Sannafly`) as the temporary project name.
- **Reason:** Clean, descriptive name for a product catalog & management platform; easily rebranded via `APP_NAME` and Storefront Settings.

## ADR-002: Stack Selection
- **Decision:** Laravel 13 + Inertia.js v2 + React 19 + TypeScript + Tailwind CSS v4 + Pest.
- **Reason:** Provides a single-repo, type-safe, SSR-ready/SPA-feel monolith with zero API boilerplate, strong security boundaries, and rapid iteration.

## ADR-003: Custom Granular RBAC vs. Heavy External Packages
- **Decision:** Implement a clean, transparent, database-backed RBAC (`roles`, `permissions`, `role_permission`, `user_role`, `user_permission`) with Laravel Policies, Gates, and `CheckPermission` middleware.
- **Reason:** Zero external package lock-in, full control over direct user permissions, role inheritance, audit logging, and easy testing.

## ADR-004: Decimal-Safe Pricing
- **Decision:** Store all prices in `DECIMAL(15,4)` columns and use `bcmath` / integer minor-unit helpers for calculations.
- **Reason:** Prevents floating-point rounding errors across multi-tier pricing, discounts, and order totals.

## ADR-005: Database for Development & Testing
- **Decision:** Configure `phpunit.xml` to use isolated SQLite `:memory:` (or dedicated test DB) for fast, repeatable Pest tests, while supporting MySQL 8+ and SQLite for local development.
- **Reason:** MySQL service was stopped in the host environment; SQLite allows immediate, isolated, transaction-safe testing and development, with full MySQL 8+ compatibility in migrations.
