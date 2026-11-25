<?php

return [
    'csp' => [
        'enabled' => env('SECURITY_CSP_ENABLED', true),
        'report_only' => env('SECURITY_CSP_REPORT_ONLY', true),
        'report_uri' => env('SECURITY_CSP_REPORT_URI'),
    ],

    'coop' => env('SECURITY_COOP', 'same-origin'),

    'hsts' => [
        'max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000),
        'include_subdomains' => (bool) env('SECURITY_HSTS_INCLUDE_SUBDOMAINS', true),
    ],
];
