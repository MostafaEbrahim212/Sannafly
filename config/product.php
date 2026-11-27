<?php

return [
    'name' => 'CatalogFlow Commerce',
    'version' => '2.0.0',
    'release_date' => '2026-11-27',
    'min_php' => '8.3.0',
    'edition' => 'Commercial',
    'support_url' => env('PRODUCT_SUPPORT_URL', ''),
    'update_check_url' => env('PRODUCT_UPDATE_URL', ''),
    'license_server_url' => env('LICENSE_SERVER_URL', ''),
    'license_grace_days' => (int) env('LICENSE_GRACE_DAYS', 14),
];
