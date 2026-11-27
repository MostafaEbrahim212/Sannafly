@php
    $locale = app()->getLocale() ?: 'en';
    $isAr = $locale === 'ar';
    $siteName = config('app.name', 'MyStore');
    $primary = '#0A5C57';
    $accent = '#F6A21E';
    try {
        $svc = app(\App\Services\SettingsService::class);
        $siteName = $isAr ? ($svc->get('site_name_ar') ?: $svc->get('site_name', $siteName)) : $svc->get('site_name', $siteName);
        $primary = $svc->get('primary_color', $primary) ?: $primary;
        $accent = $svc->get('accent_color', $accent) ?: $accent;
    } catch (\Throwable) {
    }
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $isAr ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>@yield('code') — {{ $siteName }}</title>
    <script>
        (function () {
            try {
                var m = localStorage.getItem('sf_color_mode') || 'light';
                var dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
            } catch (e) {}
        })();
    </script>
    <style>
        :root { --p: {{ $primary }}; --a: {{ $accent }}; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: system-ui, -apple-system, 'Cairo', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #f8fafc; color: #0f172a; }
        html.dark body { background: #090d16; color: #e2e8f0; }
        .card { width: 100%; max-width: 480px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px 28px; text-align: center; box-shadow: 0 20px 45px rgba(15, 23, 42, .08); }
        html.dark .card { background: #111827; border-color: #1e293b; box-shadow: 0 20px 45px rgba(0, 0, 0, .4); }
        .badge { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 16px; background: linear-gradient(135deg, var(--p), var(--a)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; }
        .code { font-size: 48px; font-weight: 900; color: var(--p); margin: 0; line-height: 1.1; }
        h1 { font-size: 20px; margin: 10px 0 8px; }
        p { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.6; }
        html.dark p { color: #94a3b8; }
        .btn { display: inline-block; padding: 11px 22px; border-radius: 12px; background: var(--p); color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">{{ mb_substr($siteName, 0, 1) }}</div>
        <div class="code">@yield('code')</div>
        <h1>@yield('title')</h1>
        <p>@yield('message')</p>
        <a href="{{ url('/') }}" class="btn">{{ $isAr ? 'العودة للرئيسية' : 'Back to Home' }}</a>
    </div>
</body>
</html>
