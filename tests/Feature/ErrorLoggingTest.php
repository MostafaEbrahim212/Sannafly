<?php

use App\Support\ErrorLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

it('logs exceptions with structured request context and redacts sensitive input', function () {
    Log::spy();

    $request = Request::create('/checkout', 'POST', [
        'customer_name' => 'Test User',
        'password' => 'super-secret',
        'token' => 'abc-123',
    ]);
    $request->attributes->set('request_id', 'req_test123');

    $exception = new RuntimeException('Something went wrong');

    ErrorLogger::reportException($exception, $request, ['order_id' => 42]);

    Log::shouldHaveReceived('error')
        ->once()
        ->withArgs(function (string $message, array $context): bool {
            return str_contains($message, '[RuntimeException] Something went wrong')
                && $context['request_id'] === 'req_test123'
                && $context['method'] === 'POST'
                && $context['order_id'] === 42
                && ! array_key_exists('password', $context['input'] ?? [])
                && ! array_key_exists('token', $context['input'] ?? [])
                && ($context['input']['customer_name'] ?? null) === 'Test User'
                && is_array($context['trace'])
                && count($context['trace']) > 0;
        });
});

it('logs handled warnings with event metadata', function () {
    Log::spy();

    $request = Request::create('/admin/orders/1/status', 'PUT');
    $request->attributes->set('request_id', 'req_warn123');

    ErrorLogger::warning('order.status_transition_failed', new RuntimeException('Invalid transition'), $request, [
        'order_id' => 1,
    ]);

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(function (string $message, array $context): bool {
            return $message === 'order.status_transition_failed: Invalid transition'
                && $context['event'] === 'order.status_transition_failed'
                && $context['request_id'] === 'req_warn123'
                && $context['order_id'] === 1;
        });
});

it('attaches X-Request-Id header on web responses', function () {
    $response = $this->get('/');

    expect($response->headers->get('X-Request-Id'))->toStartWith('req_');
});
