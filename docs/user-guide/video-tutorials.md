# Video Tutorial Plan, Scripts & Storyboards (28 Lessons)

> **Environment Note:** Direct screen-video recording (MP4/WebM) is not available in this headless environment, so no fake video files were generated. Below is the complete, ready-to-record **28-lesson production plan** with exact screen paths, actions, duration targets, and narration scripts for OBS / Loom / ScreenPal.

## Recording Setup Instructions
- Set browser window to **1440×900** (100% zoom) and hide personal bookmarks.
- Enable **Demo Mode** if recording public sales demos, or use a clean staging store for admin tutorials.
- Record each lesson as a separate short clip (**1.5–4 minutes**) following the actions below.

---

## Lesson Index & Scripts

### Module 1: Getting Started & Navigation
1. **Introduction to the System** (2:00) — Screens: `/product`, `/`, `/admin` — Script: *"Welcome to Sannafly, a bilingual white-label catalog and e-commerce platform..."* Show switching AR/EN and Dark/Light mode.
2. **Dashboard Overview** (2:00) — Screen: `/admin` — Explain the 4 KPI cards (Products, Low Stock, Categories, Orders), Welcome Banner quick actions, and live alerts.
3. **Understanding Dashboard Navigation** (1:30) — Screen: `/admin` — Demonstrate sidebar quick search, collapsing sidebar, notification bell, and Visit Storefront link.

### Module 2: Catalog & Products
4. **Creating Your First Product** (3:30) — Screen: `/admin/products/create` — Walk through all 5 Wizard steps: Basic Info + Generate SKU → Pricing & Stock → Images → Variations → Review & Publish.
5. **Editing a Product** (2:00) — Screen: `/admin/products` → `/admin/products/{id}/edit` — Search by SKU, open edit wizard, update description/status, save.
6. **Adding & Organizing Product Images** (2:00) — Screen: `/admin/products/{id}/edit` (Step 3) — Upload multiple images, reorder, click Star icon to set Main Image, delete unwanted image.
7. **Managing Multiple Prices** (2:30) — Screen: Product Step 2 + `/admin/coupons` — Set Regular Price, Sale Price, Wholesale tier (`min_quantity`), and create a `WELCOME10` coupon.
8. **Creating Categories** (2:00) — Screen: `/admin/categories` — Create parent category and subcategory in English & Arabic.
9. **Managing Brands** (1:30) — Screen: `/admin/brands` — Add a brand with logo and toggle active status.

### Module 3: Storefront & Sales Operations
10. **Customizing the Storefront** (3:30) — Screen: `/admin/customizer` & `/admin/customizer/themes` — Switch Brand/Hero/Layout/Promos tabs, reorder homepage sections, toggle Desktop/Mobile/Dark preview, save & apply a Theme Preset.
11. **Managing Orders** (3:00) — Screen: `/admin/orders` & `/admin/orders/{id}` — Filter by status, use one-click Confirm → Prepare → Ship → Deliver, print Invoice & Shipping Label.
12. **Managing Customers, Reviews & Inquiries** (2:30) — Screens: `/admin/customers`, `/admin/reviews`, `/admin/inquiries` — Approve a review, reply/update inquiry status, toggle customer status.
13. **Configuring Payment Methods & Shipping** (3:00) — Screens: `/admin/payment-methods`, `/admin/shipping-zones` — Enable COD, configure Sandbox Paymob/MyFatoorah keys, create shipping zones.
14. **Configuring System Settings** (3:00) — Screen: `/admin/settings` — Update white-label name, currency, timezone, and module toggles (`module_ecommerce`).
15. **Importing Products** (3:00) — Screen: `/admin/import-export` — Download CSV/XLSX template, upload, run Preview, confirm Import, inspect error CSV if any.
16. **Exporting Products & Analytics** (2:00) — Screens: `/admin/import-export`, `/admin/analytics` — Export catalog spreadsheet and sales CSV report.
17. **Printing Catalogs & Product Sheets** (1:30) — Screens: `/admin/print/catalog`, `/admin/print/products/{id}` — Open print view and save clean PDF via browser print.

### Module 4: Security, Maintenance & Commercial Selling
18. **Managing Permissions & Roles** (3:00) — Screens: `/admin/roles`, `/admin/users` — Create a custom role, assign granular permissions, create a staff user.
19. **Using System Diagnostics** (2:00) — Screen: `/admin/system/health` — Inspect server/extension checks and send a Test Mail.
20. **Creating a Backup** (2:00) — Screen: `/admin/system/backups` — Create a Database/Full backup, click Verify, and Download archive.
21. **Restoring a Backup** (2:00) — Screen: `/admin/system/backups` — Verify snapshot and run Restore with confirmation.
22. **Managing System Updates** (2:00) — Screen: `/admin/system/updates` — Check for updates, review release notes, verify pre-flight checks.
23. **Understanding Licensing** (2:00) — Screen: `/admin/system/license` — Activate/deactivate a commercial license key for a domain.
24. **Using Demo Mode** (2:30) — Screens: `/demo`, `/admin/login` — Show live Demo Hub, one-click `demo-reviewer` login, and `demo.guard` blocking destructive edits.
25. **Reviewing Audit & System Logs** (2:00) — Screens: `/admin/system/audit-logs`, `/admin/system-logs` — Filter audit trail, export CSV, inspect `laravel.log`.
26. **Troubleshooting Common Problems** (2:30) — Screens: `/admin/system/health`, `/admin/system/support` — Generate anonymized Support Diagnostic bundle and check common fixes.
27. **Installing the Product** (3:30) — Screen: `/install` — Walk through DB test, `.env` save, migrations/seeders, and owner creation.
28. **Preparing the Product for a Real Customer** (3:00) — Screens: `/admin/settings`, `/admin/system/license`, `/admin/system/backups` — Turn off Demo Mode, verify license, take initial backup, test live checkout.
