# Frequently Asked Questions (FAQ)

### General & Modes
- **Can I use this strictly as a product catalog without online checkout?**
  Yes. Go to **Settings** (`/admin/settings`) and disable `module_ecommerce`. The cart, checkout, and online orders are hidden while products, categories, inquiries, and WhatsApp buttons remain active.
- **Does the platform support both Arabic and English?**
  Yes. Both Storefront and Admin Dashboard support English (LTR) and Arabic (RTL) switching, plus bilingual fields on products, categories, settings, customizer, and policies.

### Products & Pricing
- **How do I add Wholesale or VIP prices?**
  In the Product Wizard (**Step 2: Pricing & Stock**), toggle **Advanced Pricing** to enter amounts and `min_quantity` for `wholesale` / `vip` price types (requires `module_custom_pricing = true`).
- **How do I change the main product photo?**
  In **Step 3: Images** of the Product Edit wizard, click the **Star** icon on any uploaded image to make it the primary image.

### Payments & Orders
- **Which payment methods are built in?**
  Cash on Delivery (`cod`), Bank Transfer (`bank_transfer`), `myfatoorah`, `fawry`, `paymob`, and `kashier`.
- **What happens when an order is cancelled or returned?**
  The Order State Machine automatically releases reserved stock back to product inventory inside a database transaction.

### Security, Demo & Licensing
- **Why am I getting "This action is disabled in Demo Mode"?**
  Demo Mode is active and `demo.guard` is blocking settings, payment, deletion, backup, update, or license changes. Disable Demo Mode for production stores.
- **How do I let a client test the admin panel safely?**
  Enable Demo Mode and send them to `/demo`. They can click **Admin Demo** to sign in as the restricted `demo-reviewer` (`demo@example.com`).
