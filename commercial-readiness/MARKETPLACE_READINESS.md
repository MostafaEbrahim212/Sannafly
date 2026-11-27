# Marketplace Readiness & Release Checklist

## Marketplace Submission Draft
- **Product Name:** CatalogFlow Commerce — Bilingual (AR/EN) Laravel + React E-Commerce & Catalog Platform
- **Key Features:** Dual RTL/LTR, Dark/Light Mode, 7-Step Web Installer, RBAC, Multi-Gateway Egyptian & MENA Payments (Fawry, MyFatoorah, Paymob, Kashier, InstaPay/Wallet Receipt, COD), Weight & Governorate Shipping, Advanced Coupons, Real-Time Notifications, System Logs & Tools, Backup/Restore, Licensing.
- **Technical Requirements:** PHP 8.3+, MySQL 8.0+ / MariaDB 10.6+, `bcmath`, `pdo_mysql`, `mbstring`, `openssl`, `gd`/`imagick`, `zip`.

## Pre-Submission Checklist
- [x] Neutral White-Label defaults
- [x] Essential vs Demo seeders separated
- [x] `/install` wizard & dual lock tested
- [x] Release ZIPs generated in `release/`
- [ ] Capture storefront & admin screenshots in Light & Dark modes (EN & AR)
- [ ] Deploy live demo site with `APP_SEED_DEMO=true` and read-only demo guard
- [ ] Attach legal EULA / Envato Regular & Extended License terms
