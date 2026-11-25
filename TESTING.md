# CatalogFlow — Database Architecture

## Core Entity Groups
1. **Users & RBAC:** `users`, `roles`, `permissions`, `role_permission`, `user_role`, `user_permission`, `audit_logs`
2. **Catalog Core:** `categories` (self-referencing `parent_id`), `brands`, `products`, `product_images`, `price_types`, `product_prices`
3. **Variations & Inventory:** `attributes`, `attribute_options`, `product_variations`, `variation_attribute_options`, `stock_movements`
4. **Settings & Customization:** `settings`, `storefront_themes`, `custom_pages`
5. **Import/Export:** `import_jobs`, `import_errors`
6. **Optional E-Commerce:** `payment_methods`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `product_inquiries`

## Transaction & Concurrency Guarantees
- Multi-table writes (product + images + prices + variations; order + items + stock reservation) run inside `DB::transaction()`.
- Stock adjustments and order reservations acquire pessimistic row locks (`lockForUpdate()`) in deterministic ID order to prevent deadlocks and overselling.
- Unique constraints on `sku`, `slug`, `email`, and `(product_id, variation_hash)` enforce integrity at the database level.
