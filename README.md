# صنّفلي — Sannafly

**صنّف. اعرض. بِع.**  
**Categorize. Display. Sell.**

Sannafly is a production-quality **product catalog, product management, and e-commerce platform** built for merchants who need full control over their products, prices, inventory, and storefront — in Arabic and English, with full RTL/LTR support.

It runs in two modes from a single codebase:

- **Catalog mode** — showcase products professionally without online selling.
- **Store mode** — enable the built-in e-commerce modules (cart, checkout, orders, coupons, shipping zones).

---

## ✨ Features

### Products & Catalog
- Nested, cycle-safe categories, brands, and multiple images per product and per variation (with automatic fallback to base product images)
- Real image pipeline: automatic **WebP** conversion with thumbnail (`400px`) and main (`800px`+) sizes via Intervention Image v4
- **Multiple price types** per product (regular, sale, wholesale, retail, member) with decimal-exact money handling
- Product attributes and **variations** (size, color, …) with their own SKUs, prices, stock, and images
- Storefront with search, multi-faceted filters, sorting, wishlist, verified-purchase reviews, and rich SEO (`sitemap.xml`, `robots.txt`, Open Graph, JSON-LD)

### Inventory & Orders
- Stock movements ledger — every change is recorded and auditable
- Row-locked, transactional stock operations (`OrderService` state machine)
- Idempotent order placement, customer order history, order tracking, printable admin invoices, and automatic email notifications

### Coupons & Shipping Zones
- Promo coupons (percent or fixed, min order, max discount, usage limit, expiry)
- City/governorate-based shipping zones with free-shipping thresholds

### Users, Roles & Security
- Separated Customer (`auth:customer`) and Admin (`auth:web`) authentication, including password reset flows
- Permission-based **RBAC** with audit logs and legal policy pages (`/policies/privacy-policy`, `/policies/terms`, `/policies/refund-policy`)

### Storefront Customization
- Live Theme Engine (`Sannafly Petrol` `#0A5C57`, `Souq Marigold` `#F6A21E`, `Ink` `#15211F`, `Paper` `#FAF7F0`, customizable text color, surface, corner radius)

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.4 |
| Frontend | React 19 + TypeScript + Inertia.js |
| Styling | Tailwind CSS v4, Vite |
| Database | MySQL 8 (production target) · SQLite (development/tests) |
| Testing | Pest / PHPUnit |
