<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ErrorLogger
{
    /**
     * Sensitive input keys that must never be written to log files.
     *
     * @var array<int, string>
     */
    private const REDACTED_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        '_token',
        'secret',
        'api_key',
        'authorization',
        'credit_card',
        'card_number',
        'cvv',
        'cvc',
        'otp',
    ];

    /**
     * Log an unhandled or critical exception with full structured request and stack context.
     *
     * @param  array<string, mixed>  $extra
     */
    public static function reportException(Throwable $e, ?Request $request = null, array $extra = []): void
    {
        $context = self::buildExceptionContext($e, $request, $extra);

        $title = sprintf(
            '[%s] %s in %s',
            class_basename($e),
            $e->getMessage() !== '' ? $e->getMessage() : '(no message)',
            $context['location']
        );

        Log::error($title, $context);
    }

    /**
     * Log a handled/recoverable error or business exception with clean structured context.
     *
     * @param  array<string, mixed>  $extra
     */
    public static function warning(string $event, Throwable|string $error, ?Request $request = null, array $extra = []): void
    {
        $request ??= self::safeRequest();

        $context = array_merge(
            self::buildRequestContext($request),
            [
                'event' => $event,
            ],
            $extra
        );

        if ($error instanceof Throwable) {
            $context['exception'] = $error::class;
            $context['message'] = $error->getMessage();
            $context['location'] = self::relativePath($error->getFile()).':'.$error->getLine();
            $message = sprintf('%s: %s', $event, $error->getMessage());
        } else {
            $message = sprintf('%s: %s', $event, $error);
        }

        Log::warning($message, $context);
    }

    /**
     * Log a structured payment lifecycle event to the dedicated payments channel.
     *
     * @param  array<string, mixed>  $context
     */
    public static function payment(string $event, array $context = [], string $level = 'info'): void
    {
        $payload = array_merge(
            self::buildRequestContext(self::safeRequest()),
            ['event' => $event],
            self::sanitizeInput($context)
        );

        Log::channel('payments')->log($level, $event, $payload);

        if (in_array($level, ['warning', 'error', 'critical', 'alert', 'emergency'], true)) {
            Log::log($level, $event, $payload);
        }
    }

    /**
     * Log a security-relevant event to the dedicated security channel.
     *
     * @param  array<string, mixed>  $context
     */
    public static function security(string $event, array $context = [], string $level = 'warning'): void
    {
        $payload = array_merge(
            self::buildRequestContext(self::safeRequest()),
            ['event' => $event],
            self::sanitizeInput($context)
        );

        Log::channel('security')->log($level, $event, $payload);
    }

    /**
     * Build a structured context array for an exception.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    public static function buildExceptionContext(Throwable $e, ?Request $request = null, array $extra = []): array
    {
        $request ??= self::safeRequest();

        $context = array_merge(
            self::buildRequestContext($request),
            [
                'exception' => $e::class,
                'code' => $e->getCode(),
                'location' => self::relativePath($e->getFile()).':'.$e->getLine(),
                'trace' => self::formatTrace($e),
            ],
            $extra
        );

        if ($e->getPrevious() instanceof Throwable) {
            $prev = $e->getPrevious();
            $context['previous'] = [
                'exception' => $prev::class,
                'message' => $prev->getMessage(),
                'location' => self::relativePath($prev->getFile()).':'.$prev->getLine(),
            ];
        }

        return $context;
    }

    /**
     * Build sanitized HTTP or CLI context for the current execution.
     *
     * @return array<string, mixed>
     */
    public static function buildRequestContext(?Request $request = null): array
    {
        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            return [
                'env' => app()->environment(),
                'cli' => true,
                'argv' => implode(' ', $_SERVER['argv'] ?? []),
            ];
        }

        if (! $request instanceof Request) {
            return ['env' => app()->environment()];
        }

        $user = null;
        try {
            $user = $request->user();
        } catch (Throwable) {
            $user = null;
        }

        $route = $request->route();
        $routeName = $route?->getName() ?: $route?->getActionName();

        $input = [];
        try {
            $input = self::sanitizeInput($request->except(self::REDACTED_KEYS));
        } catch (Throwable) {
            $input = [];
        }

        $context = [
            'request_id' => $request->attributes->get('request_id') ?? (string) Str::uuid(),
            'method' => $request->getMethod(),
            'url' => $request->fullUrl(),
            'route' => $routeName,
            'ip' => $request->ip(),
            'user_id' => $user?->getAuthIdentifier(),
            'user_email' => $user->email ?? null,
        ];

        if ($input !== []) {
            $context['input'] = $input;
        }

        return array_filter($context, static fn ($value) => $value !== null && $value !== '');
    }

    /**
     * Produce a concise, readable stack trace prioritizing application frames over vendor noise.
     *
     * @return array<int, string>
     */
    private static function formatTrace(Throwable $e): array
    {
        $frames = $e->getTrace();
        $appFrames = [];
        $topFrames = [];

        foreach ($frames as $index => $frame) {
            $file = $frame['file'] ?? '[internal]';
            $line = $frame['line'] ?? 0;
            $relative = self::relativePath((string) $file);
            $call = self::formatFrameCall($frame);
            $formatted = sprintf('#%d %s(%d): %s', $index, $relative, (int) $line, $call);

            if ($index < 3) {
                $topFrames[] = $formatted;
            }

            $isAppFrame = str_starts_with($relative, 'app/')
                || str_starts_with($relative, 'routes/')
                || str_starts_with($relative, 'database/')
                || str_starts_with($relative, 'config/')
                || str_starts_with($relative, 'bootstrap/');

            if ($isAppFrame) {
                $appFrames[] = $formatted;
            }
        }

        $merged = array_values(array_unique(array_merge($appFrames, $topFrames)));

        return array_slice($merged, 0, 15);
    }

    /**
     * @param  array<string, mixed>  $frame
     */
    private static function formatFrameCall(array $frame): string
    {
        $class = isset($frame['class']) && is_string($frame['class']) ? $frame['class'] : '';
        $type = isset($frame['type']) && is_string($frame['type']) ? $frame['type'] : '';
        $function = isset($frame['function']) && is_string($frame['function']) ? $frame['function'] : '';

        return $class.$type.$function.'()';
    }

    /**
     * Recursively redact sensitive keys and truncate oversized strings in logged input.
     *
     * @param  array<mixed, mixed>  $data
     * @return array<mixed, mixed>
     */
    private static function sanitizeInput(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            if (in_array($lowerKey, self::REDACTED_KEYS, true) || str_contains($lowerKey, 'password') || str_contains($lowerKey, 'secret')) {
                $sanitized[$key] = '[REDACTED]';

                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeInput($value);

                continue;
            }

            if (is_string($value) && mb_strlen($value) > 300) {
                $sanitized[$key] = mb_substr($value, 0, 300).'...[truncated]';

                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    private static function relativePath(string $path): string
    {
        $normalized = str_replace('\\', '/', $path);
        $base = rtrim(str_replace('\\', '/', base_path()), '/').'/';

        if (str_starts_with($normalized, $base)) {
            return substr($normalized, strlen($base));
        }

        return $normalized;
    }

    private static function safeRequest(): ?Request
    {
        try {
            $request = request();

            return $request instanceof Request ? $request : null;
        } catch (Throwable) {
            return null;
        }
    }
}
