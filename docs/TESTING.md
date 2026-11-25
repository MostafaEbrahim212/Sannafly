# Testing Guide

## Backend Test Suites (Pest 4)
`phpunit.xml` defines five isolated testsuites:
- `tests/Unit`: Services, `Money` helper, `Coupon`, `ShippingZone`, gateways (`Http::fake`), Policies, Middleware.
- `tests/Feature`: Route authorization matrix, 8×8 order state machine, checkout flows, commands, seeders, hardening regressions.
- `tests/Integration`: End-to-end checkout + callback and Arabic UTF-8 CSV import/export.
- `tests/Security`: IDOR, CSV formula injection, malicious image uploads, encrypted `PaymentMethod.config`, session fixation.
- `tests/Concurrency`: Multi-process MySQL 8 `lockForUpdate` concurrency tests (`--group=mysql`, skipped on SQLite).

### Common Commands
```bash
# Run all SQLite-compatible tests
php artisan test --exclude-group=mysql

# Run in random order (flake check)
php artisan test --exclude-group=mysql --order-by=random

# Run with coverage thresholds (requires PCOV/Xdebug)
composer run test:coverage

# Static analysis (Larastan) & code style (Pint)
composer run analyse
composer run lint
```

## MySQL 8 Concurrency Setup
To run `tests/Concurrency/MysqlConcurrencyTest.php` locally, point `DB_CONNECTION=mysql` to a MySQL 8 instance and run:
```bash
php artisan test --group=mysql
```

## Frontend & E2E Tests
```bash
# Vitest + React Testing Library + vitest-axe
npm test

# TypeScript strict check
npx tsc --noEmit

# Playwright E2E (requires seeded database)
php artisan migrate:fresh --seed --force
npx playwright test
```

## Mutation Testing
Infection configuration is in `infection.json5` targeting `app/Services` and `app/Models/Coupon.php` (minimum MSI 75%):
```bash
./vendor/bin/infection --threads=4
```
