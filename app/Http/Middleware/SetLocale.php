<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['en', 'ar'];

    public function handle(Request $request, Closure $next): Response
    {
        $requested = $request->query('lang')
            ?? $request->session()->get('locale')
            ?? $request->cookie('locale')
            ?? config('app.locale', 'en');

        $locale = in_array($requested, self::SUPPORTED, true) ? $requested : 'en';

        App::setLocale($locale);
        $request->session()->put('locale', $locale);

        return $next($request);
    }
}
