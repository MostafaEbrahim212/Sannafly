# Sales Demo & Video Tutorial Feature Mapping

Every entry below maps an **actually implemented** module (verified in `routes/web.php`, controllers, services, and React pages) to its Sales Presentation section (`/demo/presentation`) and Video Tutorial (`/admin/help/videos`).

| # | Implemented Feature | Routes & Controllers | Sales Presentation Section | Video Tutorial ID(s) |
| --- | --- | --- | --- | --- |
| 1 | Product Landing & Demo Hub | `/product`, `/demo` (`DemoModeController`) | Section 1: Opening | `vid-01` |
| 2 | Storefront, Catalog, Cart, Coupons, Tracking | `/`, `/catalog`, `/products/{slug}`, `/cart`, `/track-order` (`StorefrontController`, `CartCheckoutController`) | Section 2: Storefront Experience | `vid-10`, `vid-14` |
| 3 | Admin Dashboard & Realtime Alerts | `/admin`, `/admin/realtime/feed`, `/admin/notifications` (`DashboardController`, `NotificationController`) | Section 3: Dashboard Overview | `vid-02`, `vid-03` |
| 4 | Products, 5-Step Wizard, Gallery, Variations, Inventory | `/admin/products/*`, `/admin/attributes`, `/admin/inventory` (`ProductController`, `AttributeController`, `InventoryController`) | Section 4: Product Management | `vid-04`, `vid-05`, `vid-06`, `vid-07` |
| 5 | Categories & Brands | `/admin/categories`, `/admin/brands` (`CategoryController`, `BrandController`) | Section 5: Categories & Brands | `vid-08`, `vid-09` |
| 6 | Storefront Customizer, Theme Presets, Policies | `/admin/customizer`, `/admin/customizer/themes`, `/admin/policies` (`SettingsController`, `ThemePresetController`, `PolicyController`) | Section 6: Store Customization | `vid-11`, `vid-12` |
| 7 | Orders State Machine, Customers, Reviews, Inquiries | `/admin/orders/*`, `/admin/customers`, `/admin/reviews`, `/admin/inquiries` (`OrderController`, `CustomerController`, `ReviewController`, `InquiryController`) | Section 7: Orders & Customers | `vid-13`, `vid-15` |
| 8 | Payment Methods (COD, Bank, MyFatoorah, Fawry, Paymob, Kashier) & Shipping Zones | `/admin/payment-methods`, `/admin/shipping-zones`, `/payments/*` (`PaymentMethodController`, `ShippingZoneController`, `CartCheckoutController`) | Section 8: Payments & Checkout | `vid-16`, `vid-17` |
| 9 | Sales Analytics & CSV Export | `/admin/analytics`, `/admin/analytics/export` (`AnalyticsController`) | Section 9: Reports & Analytics | `vid-18` |
| 10 | Bulk Import/Export & Printing | `/admin/import-export/*`, `/admin/print/*` (`ImportExportController`, `PrintController`) | Section 10: Import, Export & Productivity | `vid-19`, `vid-20` |
| 11 | Settings, RBAC, Audit Logs, Health, Backups, Updates, License, Support, Installer | `/admin/settings`, `/admin/users`, `/admin/roles`, `/admin/system/*`, `/install` | Section 11: Security, Maintenance & Administration | `vid-21` – `vid-28` |
