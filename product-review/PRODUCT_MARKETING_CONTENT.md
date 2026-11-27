# Product Marketing Content (Verified Capabilities Only)

## Product Name
CatalogFlow Commerce (White-Label Edition)

## Value Proposition
A bilingual (Arabic/English, RTL/LTR) e-commerce storefront and catalog management platform built with Laravel 13, Inertia.js, React 19, TypeScript, and Tailwind CSS 4 — featuring a guided web installer, modular payment gateway architecture, granular RBAC, and built-in operations tooling.

## Target Audience
- E-commerce merchants & startups launching a bilingual store (especially Egypt & MENA markets).
- Agencies & freelance developers delivering white-label online stores to multiple clients.

## Verified Feature Categories
1. **Product & Catalog Management:** Simple & variable products, color/select attributes, multi-tier pricing (Regular, Sale, Wholesale), WebP image resizing & gallery ordering, Excel/CSV import & export, A4 catalog/product printing.
2. **Storefront & Checkout:** Bilingual AR/EN with automatic RTL/LTR switching, dark/light/system theme modes, 27 Egyptian governorates selector, flat + weight-based shipping zones, advanced coupons (`percent`, `fixed`, `free_shipping`, `first_order_only`), guest or registered checkout, order tracking.
3. **Configurable Payment Integrations:**
   - **Integrated & Configurable (requires merchant keys):** MyFatoorah, Fawry Pay, Paymob, Kashier.
   - **Built-in Offline / Receipt Flows:** InstaPay / Vodafone Cash (`wallet_transfer` with receipt upload & admin verification), Bank Transfer, Cash on Delivery (COD), Cash Pickup.
4. **Customization & White-Labeling:** Neutral branding defaults, 6 industry theme presets + custom preset import/export, live desktop/mobile/dark/light preview, reorderable homepage sections, announcement bar & promotional popup.
5. **Security & Operations:** Dual-guard authentication (`web` & `customer`), RBAC permissions, BCMath decimal money arithmetic (`DECIMAL(15,4)`), immutable audit logs with CSV export, SHA-256 SQL/ZIP backups & locked SQL restore, system health diagnostics, sanitized support export, 7-step `/install` wizard, and Demo Mode sandbox.

## Verified Technical Requirements
- PHP 8.3+ (`pdo`, `pdo_mysql`, `bcmath`, `mbstring`, `openssl`, `json`, `ctype`, `fileinfo`, `tokenizer`, `xml`, `zip`, `gd` or `imagick`).
- MySQL 8.0+ or MariaDB 10.6+.
- Apache or Nginx with HTTPS (required for live payment webhooks).
