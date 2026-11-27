<?php

namespace App\Http\Middleware;

use App\Services\DemoModeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DemoModeGuard
{
    public function __construct(private readonly DemoModeService $demo) {}

    /**
     * Enforce backend restrictions on dangerous/mutating operations when Demo Mode is active.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->demo->isEnabled()) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->inertia()) {
            return back()->with('error', 'This action is disabled in Demo Mode.');
        }

        abort(403, 'This action is disabled in Demo Mode.');
    }
}
