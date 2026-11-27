# Theme Presets Guide

- **Route:** `/admin/customizer/themes` (`customizer.themes.view`, `customizer.themes.manage`)
- **Included Presets:** Electronics Pro, Fashion Editorial, Cosmetics & Beauty, General Store, Minimal Studio, Luxury Gold.
- **Safety:** Applying a preset updates only allow-listed visual appearance keys (`ThemePresetService::ALLOWED_THEME_KEYS`); products, orders, payments, security, and license settings are never modified.
- **Import/Export:** Export presets as JSON and import validated JSON presets (blocks `<script>`, `javascript:`, and `<?php`).
