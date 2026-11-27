<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\DemoModeGuard;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequestContextMiddleware;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use App\Support\ErrorLogger;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(prepend: [
            RequestContextMiddleware::class,
        ]);

        $middleware->web(append: [
            SetLocale::class,
            EnsureUserIsActive::class,
            HandleInertiaRequests::class,
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'permission' => CheckPermission::class,
            'active' => EnsureUserIsActive::class,
            'demo.guard' => DemoModeGuard::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'payments/callback/*',
        ]);

        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('admin*') ? '/admin/login' : '/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (Throwable $e): bool {
            ErrorLogger::reportException($e);

            return false;
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request): Response {
            $status = $response->getStatusCode();
            if ($request->expectsJson() || $request->is('api/*') || $request->is('payments/callback/*')) {
                return $response;
            }

            $handledStatuses = app()->hasDebugModeEnabled()
                ? [403, 404, 419, 429, 503]
                : [403, 404, 419, 429, 500, 503];

            if (! in_array($status, $handledStatuses, true)) {
                return $response;
            }

            try {
                return Inertia::render('Errors/ErrorPage', [
                    'status' => $status,
                    'requestId' => $request->attributes->get('request_id'),
                ])->toResponse($request)->setStatusCode($status);
            } catch (Throwable) {
                return $response;
            }
        });
    })->create();
