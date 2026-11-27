# Complete End-to-End Workflow & Deployment

Follow these exact steps in order from a fresh installation until the store is ready for a real customer:

## Part A — Store Setup Walkthrough
1. **Install the System (`/install`)**: Complete environment check, database test, migrations/seeding, and owner account creation.
2. **Verify System Health (`/admin/system/health`)**: Confirm all server checks pass and send a Test Mail to verify SMTP.
3. **Configure Core Settings (`/admin/settings`)**:
   - Set **Store Name (EN/AR)**, **Contact/Support Email**, **Phone**, and **WhatsApp Number**.
   - Set **Currency Code** (e.g., `EGP`, `SAR`, `USD`) and **Currency Symbol**.
   - Set **Default Locale** (`en`/`ar`), **Timezone**, and **Modules** (`module_ecommerce`, `module_guest_checkout`, etc.).
4. **Customize Storefront & Theme (`/admin/customizer` & `/admin/customizer/themes`)**:
   - Upload Light/Dark Logos and Favicon (in Settings), pick brand colors or a Niche Preset, configure Hero & Seasonal Banner, and arrange homepage sections.
5. **Configure Legal Policies (`/admin/policies`)**: Update Privacy Policy, Terms of Service, and Return Policy in both English and Arabic.
6. **Configure Shipping & Payments (`/admin/shipping-zones` & `/admin/payment-methods`)**:
   - Create shipping zones and fees.
   - Enable COD / Bank Transfer and/or configure online gateways (MyFatoorah, Fawry, Paymob, Kashier).
7. **Build Catalog Structure (`/admin/categories`, `/admin/brands`, `/admin/attributes`)**:
   - Create parent/child categories, brands, and variation attributes (e.g., Color, Size).
8. **Add Products, Images & Pricing (`/admin/products/create` or `/admin/import-export`)**:
   - Add products with EN/AR details, Regular/Sale/Wholesale prices, stock quantities, photos, and variations.
9. **Test Storefront & Checkout (`/`, `/catalog`, `/cart`)**:
   - Browse the storefront in both Arabic & English and Dark & Light mode.
   - Add a product to cart, apply a test coupon (`/admin/coupons`), complete a test checkout, and verify order tracking (`/track-order`).
10. **Review & Fulfill Test Order (`/admin/orders`)**:
    - Confirm → Prepare → Ship → Deliver, and test Invoice/Shipping Label printing.

## Part B — Preparing for a Real Customer / Production
- Ensure **Demo Mode is OFF** (`demo_mode_enabled = false`).
- Activate the client's commercial license at `/admin/system/license`.
- Create staff accounts with least-privilege roles at `/admin/users` and `/admin/roles`.
- Take an initial verified backup at `/admin/system/backups`.
- Run `php artisan config:cache && php artisan route:cache && php artisan view:cache` (or use `/admin/system-tools` on Shared Hosting).
