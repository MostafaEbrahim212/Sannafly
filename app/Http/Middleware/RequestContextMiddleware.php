<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestContextMiddleware
{
    /**
     * Attach a unique request ID and share structured request context with all logs.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $incomingId = $request->header('X-Request-Id');
        $requestId = is_string($incomingId) && $incomingId !== ''
            ? Str::limit($incomingId, 64, '')
            : 'req_'.Str::lower(Str::random(12));

        $request->attributes->set('request_id', $requestId);

        Log::shareContext(array_filter([
            'request_id' => $requestId,
            'method' => $request->getMethod(),
            'path' => '/'.ltrim($request->path(), '/'),
            'ip' => $request->ip(),
            'user_id' => $request->user()?->getAuthIdentifier(),
        ], static fn ($value) => $value !== null && $value !== ''));

        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
