<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Support\Money;
use Illuminate\Support\Facades\Http;

class PaymobGateway implements PaymentGatewayInterface
{
    private const BASE_URL = 'https://accept.paymob.com/api';

    public function initiate(Order $order, PaymentMethod $method, string $returnUrl, string $callbackUrl): array
    {
        $config = $method->config ?? [];
        $apiKey = trim((string) ($config['api_key'] ?? ''));
        $integrationId = trim((string) ($config['integration_id'] ?? ''));
        $iframeId = trim((string) ($config['iframe_id'] ?? ''));

        if ($apiKey === '' || $integrationId === '' || $iframeId === '') {
            return ['success' => false, 'error' => __('Paymob credentials (API key, Integration ID, Iframe ID) are not configured.')];
        }

        $currency = strtoupper(trim((string) ($order->currency ?: 'EGP')));
        $amountFormatted = Money::toGateway((string) $order->grand_total);
        $amountCents = (int) bcmul($amountFormatted, '100', 0);

        $authResp = Http::acceptJson()->timeout(15)->post(self::BASE_URL.'/auth/tokens', [
            'api_key' => $apiKey,
        ]);
        $authToken = $authResp->json('token');
        if (! $authResp->successful() || ! is_string($authToken) || $authToken === '') {
            return [
                'success' => false,
                'error' => $authResp->json('detail') ?? __('Paymob authentication failed.'),
                'raw' => is_array($authResp->json()) ? $authResp->json() : [],
            ];
        }

        $orderResp = Http::acceptJson()->timeout(15)->post(self::BASE_URL.'/ecommerce/orders', [
            'auth_token' => $authToken,
            'delivery_needed' => false,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'merchant_order_id' => $order->order_number,
            'items' => [],
        ]);
        $paymobOrderId = $orderResp->json('id');
        if (! $orderResp->successful() || ! $paymobOrderId) {
            return [
                'success' => false,
                'error' => $orderResp->json('message') ?? __('Paymob order registration failed.'),
                'raw' => is_array($orderResp->json()) ? $orderResp->json() : [],
            ];
        }

        $nameParts = preg_split('/\s+/', trim((string) $order->customer_name), 2) ?: ['Customer', 'User'];
        $addr = is_array($order->shipping_address) ? $order->shipping_address : [];

        $keyResp = Http::acceptJson()->timeout(15)->post(self::BASE_URL.'/acceptance/payment_keys', [
            'auth_token' => $authToken,
            'amount_cents' => $amountCents,
            'expiration' => 3600,
            'order_id' => $paymobOrderId,
            'currency' => $currency,
            'integration_id' => (int) $integrationId,
            'lock_order_when_paid' => true,
            'billing_data' => [
                'first_name' => $nameParts[0] ?: 'Customer',
                'last_name' => $nameParts[1] ?? 'User',
                'email' => $order->customer_email ?: 'customer@example.com',
                'phone_number' => $order->customer_phone ?: '01000000000',
                'city' => $addr['city'] ?? 'Cairo',
                'country' => 'EG',
                'street' => $addr['street'] ?? 'NA',
                'building' => $addr['building'] ?? 'NA',
                'floor' => $addr['floor'] ?? 'NA',
                'apartment' => $addr['apartment'] ?? 'NA',
                'postal_code' => 'NA',
                'state' => $addr['area'] ?? 'NA',
                'shipping_method' => 'NA',
            ],
        ]);
        $paymentToken = $keyResp->json('token');
        if (! $keyResp->successful() || ! is_string($paymentToken) || $paymentToken === '') {
            return [
                'success' => false,
                'error' => $keyResp->json('message') ?? __('Paymob payment key generation failed.'),
                'raw' => is_array($keyResp->json()) ? $keyResp->json() : [],
            ];
        }

        return [
            'success' => true,
            'redirect_url' => self::BASE_URL."/acceptance/iframes/{$iframeId}?payment_token={$paymentToken}",
            'transaction_id' => (string) $paymobOrderId,
            'raw' => ['paymob_order_id' => $paymobOrderId],
        ];
    }

    public function verifyCallback(array $payload, PaymentMethod $method): array
    {
        $config = $method->config ?? [];
        $hmacSecret = trim((string) ($config['hmac_secret'] ?? ''));
        $receivedHmac = strtolower(trim((string) ($payload['hmac'] ?? '')));

        if ($hmacSecret === '' || $receivedHmac === '') {
            return ['verified' => false, 'status' => 'failed'];
        }

        $obj = is_array($payload['obj'] ?? null) ? $payload['obj'] : $payload;

        $boolStr = static function (mixed $val): string {
            if (is_bool($val)) {
                return $val ? 'true' : 'false';
            }

            return in_array(strtolower((string) $val), ['1', 'true'], true) ? 'true' : 'false';
        };

        $orderId = is_array($obj['order'] ?? null) ? ($obj['order']['id'] ?? '') : ($obj['order'] ?? '');
        $sourcePan = is_array($obj['source_data'] ?? null) ? ($obj['source_data']['pan'] ?? '') : ($obj['source_data_pan'] ?? '');
        $sourceSubType = is_array($obj['source_data'] ?? null) ? ($obj['source_data']['sub_type'] ?? '') : ($obj['source_data_sub_type'] ?? '');
        $sourceType = is_array($obj['source_data'] ?? null) ? ($obj['source_data']['type'] ?? '') : ($obj['source_data_type'] ?? '');

        $concatenated = ($obj['amount_cents'] ?? '')
            .($obj['created_at'] ?? '')
            .($obj['currency'] ?? '')
            .$boolStr($obj['error_occured'] ?? false)
            .$boolStr($obj['has_parent_transaction'] ?? false)
            .($obj['id'] ?? '')
            .($obj['integration_id'] ?? '')
            .$boolStr($obj['is_3d_secure'] ?? false)
            .$boolStr($obj['is_auth'] ?? false)
            .$boolStr($obj['is_capture'] ?? false)
            .$boolStr($obj['is_refunded'] ?? false)
            .$boolStr($obj['is_standalone_payment'] ?? false)
            .$boolStr($obj['is_voided'] ?? false)
            .$orderId
            .($obj['owner'] ?? '')
            .$boolStr($obj['pending'] ?? false)
            .$sourcePan
            .$sourceSubType
            .$sourceType
            .$boolStr($obj['success'] ?? false);

        $expectedHmac = hash_hmac('sha512', $concatenated, $hmacSecret);
        if (! hash_equals($expectedHmac, $receivedHmac)) {
            return ['verified' => false, 'status' => 'failed'];
        }

        $isSuccess = $boolStr($obj['success'] ?? false) === 'true';
        $isPending = $boolStr($obj['pending'] ?? false) === 'true';
        $isError = $boolStr($obj['error_occured'] ?? false) === 'true';

        $status = ($isSuccess && ! $isPending && ! $isError)
            ? 'completed'
            : ($isPending ? 'pending' : 'failed');

        $amountCents = (string) ($obj['amount_cents'] ?? '0');
        $amount = Money::div($amountCents, '100', 2);
        $currency = strtoupper(trim((string) ($obj['currency'] ?? 'EGP'))) ?: 'EGP';
        $orderNumber = is_array($obj['order'] ?? null)
            ? ($obj['order']['merchant_order_id'] ?? null)
            : ($obj['merchant_order_id'] ?? null);

        return [
            'verified' => true,
            'order_number' => is_string($orderNumber) ? $orderNumber : null,
            'transaction_id' => isset($obj['id']) ? (string) $obj['id'] : null,
            'status' => $status,
            'amount' => $amount,
            'currency' => $currency,
            'raw' => $payload,
        ];
    }

    public function refund(Order $order, PaymentMethod $method, string $amount, ?string $reason = null): array
    {
        $config = $method->config ?? [];
        if (empty($config['auto_refund'])) {
            return ['success' => false, 'error' => __('Auto-refund is disabled for Paymob.')];
        }

        $apiKey = trim((string) ($config['api_key'] ?? ''));
        $transactionId = $order->payments()->where('status', 'completed')->latest()->value('transaction_reference');
        if ($apiKey === '' || ! $transactionId) {
            return ['success' => false, 'error' => __('Missing Paymob API key or transaction reference.')];
        }

        $authResp = Http::acceptJson()->timeout(15)->post(self::BASE_URL.'/auth/tokens', [
            'api_key' => $apiKey,
        ]);
        $authToken = $authResp->json('token');
        if (! $authResp->successful() || ! is_string($authToken) || $authToken === '') {
            return ['success' => false, 'error' => __('Paymob authentication failed.')];
        }

        $amountCents = (int) bcmul(Money::toGateway($amount), '100', 0);
        $resp = Http::acceptJson()->timeout(15)->post(self::BASE_URL.'/acceptance/void_refund/refund', [
            'auth_token' => $authToken,
            'transaction_id' => (int) $transactionId,
            'amount_cents' => $amountCents,
        ]);

        $json = $resp->json();
        if (! $resp->successful() || empty($json['success'])) {
            return [
                'success' => false,
                'error' => $json['message'] ?? __('Paymob refund failed.'),
                'raw' => is_array($json) ? $json : [],
            ];
        }

        return [
            'success' => true,
            'refund_id' => isset($json['id']) ? (string) $json['id'] : (string) $transactionId,
            'raw' => is_array($json) ? $json : [],
        ];
    }
}
