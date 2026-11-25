<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Support\Money;
use Illuminate\Support\Facades\Http;

class KashierGateway implements PaymentGatewayInterface
{
    public function initiate(Order $order, PaymentMethod $method, string $returnUrl, string $callbackUrl): array
    {
        $config = $method->config ?? [];
        $merchantId = trim((string) ($config['merchant_id'] ?? ''));
        $apiKey = trim((string) ($config['api_key'] ?? ''));

        if ($merchantId === '' || $apiKey === '') {
            return ['success' => false, 'error' => __('Kashier Merchant ID or API Key is not configured.')];
        }

        $sandbox = (bool) ($config['sandbox'] ?? true);
        $mode = $sandbox ? 'test' : 'live';
        $amount = Money::toGateway((string) $order->grand_total);
        $currency = strtoupper(trim((string) ($order->currency ?: 'EGP')));
        $orderId = $order->order_number;

        $path = "/?payment={$merchantId}.{$orderId}.{$amount}.{$currency}";
        $hash = hash_hmac('sha256', $path, $apiKey, false);

        $query = http_build_query([
            'merchantId' => $merchantId,
            'orderId' => $orderId,
            'amount' => $amount,
            'currency' => $currency,
            'hash' => $hash,
            'mode' => $mode,
            'merchantRedirect' => $returnUrl,
            'serverWebhook' => $callbackUrl,
            'display' => app()->getLocale() === 'ar' ? 'ar' : 'en',
        ]);

        return [
            'success' => true,
            'redirect_url' => "https://payments.kashier.io/?{$query}",
            'transaction_id' => $orderId,
            'raw' => ['orderId' => $orderId, 'mode' => $mode],
        ];
    }

    public function verifyCallback(array $payload, PaymentMethod $method): array
    {
        $config = $method->config ?? [];
        $apiKey = trim((string) ($config['api_key'] ?? ''));

        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $receivedSig = strtolower(trim((string) ($data['signature'] ?? $payload['signature'] ?? '')));

        if ($apiKey === '' || $receivedSig === '') {
            return ['verified' => false, 'status' => 'failed'];
        }

        $queryString = '';
        foreach ($data as $key => $value) {
            if (in_array((string) $key, ['signature', 'mode'], true) || is_array($value)) {
                continue;
            }
            $queryString .= "&{$key}={$value}";
        }
        $queryString = ltrim($queryString, '&');

        $expectedSig = hash_hmac('sha256', $queryString, $apiKey, false);
        if (! hash_equals($expectedSig, $receivedSig)) {
            return ['verified' => false, 'status' => 'failed'];
        }

        $paymentStatus = strtoupper((string) ($data['paymentStatus'] ?? ''));
        $status = match ($paymentStatus) {
            'SUCCESS', 'CAPTURED' => 'completed',
            'PENDING' => 'pending',
            default => 'failed',
        };

        $rawAmount = $data['amount'] ?? null;
        $amount = $rawAmount !== null && $rawAmount !== '' ? Money::toGateway((string) $rawAmount) : null;
        $currency = $data['currency'] ?? null;

        return [
            'verified' => true,
            'order_number' => $data['merchantOrderId'] ?? $data['orderId'] ?? null,
            'transaction_id' => $data['transactionId'] ?? $data['orderId'] ?? null,
            'status' => $status,
            'amount' => $amount,
            'currency' => is_string($currency) && trim($currency) !== '' ? strtoupper(trim($currency)) : null,
            'raw' => $payload,
        ];
    }

    public function refund(Order $order, PaymentMethod $method, string $amount, ?string $reason = null): array
    {
        $config = $method->config ?? [];
        if (empty($config['auto_refund'])) {
            return ['success' => false, 'error' => __('Auto-refund is disabled for Kashier.')];
        }

        $apiKey = trim((string) ($config['api_key'] ?? ''));
        $transactionId = $order->payments()->where('status', 'completed')->latest()->value('transaction_reference');
        if ($apiKey === '' || ! $transactionId) {
            return ['success' => false, 'error' => __('Missing Kashier API key or transaction reference.')];
        }

        $sandbox = (bool) ($config['sandbox'] ?? true);
        $baseUrl = $sandbox ? 'https://test-api.kashier.io' : 'https://api.kashier.io';

        $resp = Http::withHeaders(['Authorization' => $apiKey])
            ->acceptJson()
            ->timeout(15)
            ->put("{$baseUrl}/orders/{$order->order_number}/refund", [
                'amount' => Money::toGateway($amount),
                'transactionId' => $transactionId,
                'reason' => $reason ?: "Refund for order {$order->order_number}",
            ]);

        $json = $resp->json();
        if (! $resp->successful() || (isset($json['status']) && strtoupper((string) $json['status']) !== 'SUCCESS')) {
            return [
                'success' => false,
                'error' => $json['message'] ?? __('Kashier refund failed.'),
                'raw' => is_array($json) ? $json : [],
            ];
        }

        return [
            'success' => true,
            'refund_id' => $json['refundId'] ?? $transactionId,
            'raw' => is_array($json) ? $json : [],
        ];
    }
}
