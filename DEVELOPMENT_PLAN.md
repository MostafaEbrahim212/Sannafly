# CatalogFlow — Development Plan

> **Temporary Project Name:** `CatalogFlow` (`C:\laragon\www\catalogflow`)  
> **Stack:** Laravel 13 + PHP 8.4 + React 19 + TypeScript + Inertia.js + Tailwind CSS + Vite + Pest + Playwright

## Phase 1 — Foundation
- [x] Project creation (`catalogflow`)
- [ ] Install Inertia.js, React, TypeScript, Tailwind CSS, Pest, Intervention Image (or GD/Imagick service)
- [ ] Configure database (SQLite for isolated tests, MySQL 8+ / SQLite for local dev)
- [ ] Configure Localization (`en` / `ar`) and RTL/LTR directionality
- [ ] Create core documentation (`ARCHITECTURE.md`, `DATABASE.md`, `DECISIONS.md`, `SECURITY.md`, `TESTING.md`, `DEVELOPMENT_LOG.md`)
- [ ] Base Design System & Layouts (Admin Dashboard Layout + Public Storefront Layout)

## Phase 2 — Users, RBAC & Security
- [ ] Users table extensions (phone, avatar, status, last_login_at, soft deletes)
- [ ] Granular RBAC schema (`roles`, `permissions`, `role_permission`, `user_role`, `user_permission`)
- [ ] Auth workflows (Login, Logout, Password Reset, Rate Limiting, Session invalidation, Account status checks)
- [ ] Admin User Management CRUD + Status (activate, deactivate, suspend, restore) + Role/Permission assignment
- [ ] Role & Permission Management CRUD
- [ ] Policies, Gates, and `permission:` middleware
- [ ] Audit Log system (`audit_logs` table, `AuditLogger` service, Admin Audit Log viewer with filters)
- [ ] Security & Authorization Pest tests

## Phase 3 — Products, Categories, Brands, Images & Multi-Pricing
- [ ] Categories (nested tree, image, description, SEO, ordering, visibility)
- [ ] Brands (logo, description, SEO, visibility)
- [ ] Products (name, slug, sku, barcode, descriptions, status, visibility, featured, SEO, specs, custom_fields)
- [ ] Multiple Product Images (multi-upload, drag-and-drop reorder, main image, alt/caption, WebP optimization + thumbnails)
- [ ] Multiple Prices (`price_types`, `product_prices` with decimal-safe `DECIMAL(15,4)`, quantity-based tiers)
- [ ] Transactional `ProductService` (`DB::transaction()`)

## Phase 4 — Variations & Inventory
- [ ] Attributes & Attribute Options
- [ ] Product Variations (SKU, barcode, price, stock, weight, status, variation-specific image & prices, combination generator)
- [ ] Inventory & Stock Movements (`stock_movements`, row-level `lockForUpdate()`, low-stock thresholds, optional backorders/negative stock)
- [ ] Variation & Transaction Pest tests

## Phase 5 — Public Storefront
- [ ] Homepage (configurable hero, featured products, categories, brands)
- [ ] Product Catalog Listing (server-side search, multi-filter, sorting, pagination)
- [ ] Product Details Page (gallery, variation selector updating price/SKU/stock/image, specs, related products, WhatsApp / Inquiry)
- [ ] SEO metadata & responsive RTL/LTR UX

## Phase 6 — Admin Dashboard & Settings
- [ ] Modular Dashboard Widgets (product counts, active/draft, low stock, recent activity, recent products)
- [ ] Advanced Product Management Table (search, filters, sorting, bulk actions, column visibility)
- [ ] Grouped Settings & Feature/Module Toggles (`settings` table + `SettingsService`)

## Phase 7 — Import & Export
- [ ] CSV & Excel Export (products, filtered/selected)
- [ ] CSV & Excel Import (template download, column mapping, preview, validation, duplicate/SKU handling, chunked transactional processing, error report)

## Phase 8 — Printing
- [ ] Dedicated Print Templates (Product Catalog, Product Details, Price List, Stock Report, Barcode/Product Labels)
- [ ] Arabic/English & RTL/LTR print styles without dashboard chrome

## Phase 9 — Storefront Customization
- [ ] Theme & Storefront Customizer (Logo, Favicon, Colors, Typography, Header/Footer, Sections, Preview before publish)

## Phase 10 — Optional E-Commerce
- [ ] Configurable Cart, Checkout (Guest & Customer), Orders, Order Items, Order Statuses
- [ ] Configurable Payment Methods (Cash, Bank Transfer, COD, extensible gateway interface, idempotent callbacks)
- [ ] Transactional stock reservation, order creation, cancellation & release

## Phase 11 — QA, Security, Performance & Final Verification
- [ ] Full Pest test suite (Auth, RBAC, Products, Variations, Transactions, Imports, E-Commerce)
- [ ] Playwright / Browser UX & RTL/LTR verification
- [ ] Security & Performance audit (N+1 queries, indexes, bundle size)
- [ ] Final documentation & `README.md`
