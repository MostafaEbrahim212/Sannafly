<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        if ($coop = config('security.coop', 'same-origin')) {
            $response->headers->set('Cross-Origin-Opener-Policy', (string) $coop);
        }

        if (app()->environment('production') && $request->isSecure()) {
            $maxAge = (int) config('security.hsts.max_age', 31536000);
            $hsts = "max-age={$maxAge}";
            if (config('security.hsts.include_subdomains', true)) {
                $hsts .= '; includeSubDomains';
            }
            $response->headers->set('Strict-Transport-Security', $hsts);
        }

        if (config('security.csp.enabled', true)) {
            $isLocal = app()->environment('local');
            $viteHttp = $isLocal ? ' http://localhost:5173 http://127.0.0.1:5173' : '';
            $viteWs = $isLocal ? ' ws://localhost:5173 ws://127.0.0.1:5173' : '';
            $scriptEval = $isLocal ? " 'unsafe-eval'" : '';

            $directives = [
                "default-src 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
                "object-src 'none'",
                "script-src 'self' 'unsafe-inline'{$scriptEval}{$viteHttp}",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com{$viteHttp}",
                "font-src 'self' data: https://fonts.gstatic.com",
                "img-src 'self' data: blob: https:",
                "connect-src 'self'{$viteHttp}{$viteWs}",
            ];

            if ($reportUri = config('security.csp.report_uri')) {
                $directives[] = "report-uri {$reportUri}";
            }

            $headerName = config('security.csp.report_only', true)
                ? 'Content-Security-Policy-Report-Only'
                : 'Content-Security-Policy';

            $response->headers->set($headerName, implode('; ', $directives));
        }

        return $response;
    }
}
