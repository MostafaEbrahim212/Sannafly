<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Support\Money;
use Illuminate\Support\Facades\Http;

class FawryGateway implements PaymentGatewayInterface
{
    public function initiate(Order $order, PaymentMethod $method, string $returnUrl, string $callbackUrl): array
    {
        $config = $method->config ?? [];
        $merchantCode = trim((string) ($config['merchant_code'] ?? ''));
        $securityKey = trim((string) ($config['security_key'] ?? ''));

        if ($merchantCode === '' || $securityKey === '') {
            return ['success' => false, 'error' => __('Fawry merchant code or security key is not configured.')];
        }

        if (strtoupper(trim((string) $order->currency)) !== 'EGP') {
            return ['success' => false, 'error' => __('Fawry only supports EGP currency.')];
        }

        $sandbox = (bool) ($config['sandbox'] ?? true);
        $baseUrl = $sandbox ? 'https://atfawry.fawrystaging.com' : 'https://www.atfawry.com';

        $merchantRefNum = $order->order_number;
        $customerProfileId = (string) ($order->user_id ?? 'guest');
        $paymentMethod = 'PAYATFAWRY';
        $amountFormatted = Money::toGateway((string) $order->grand_total);

        $signature = hash('sha256', $merchantCode.$merchantRefNum.$customerProfileId.$paymentMethod.$amountFormatted.$securityKey);

        $response = Http::acceptJson()
            ->timeout(15)
            ->post("{$baseUrl}/ECommerceWeb/Fawry/payments/charge", [
                'merchantCode' => $merchantCode,
                'merchantRefNum' => $merchantRefNum,
                'customerProfileId' => $customerProfileId,
                'customerName' => $order->customer_name,
                'customerMobile' => $order->customer_phone,
                'customerEmail' => $order->customer_email ?: 'customer@example.com',
                'paymentMethod' => $paymentMethod,
                'amount' => $amountFormatted,
                'currencyCode' => $order->currency ?: 'EGP',
                'description' => "Order {$order->order_number}",
                'chargeItems' => [
                    [
                        'itemId' => $order->order_number,
                        'description' => "Order {$order->order_number}",
                        'price' => $amountFormatted,
                        'quantity' => 1,
                    ],
                ],
                'signature' => $signature,
            ]);

        $json = $response->json();
        if (! $response->successful() || (isset($json['statusCode']) && (int) $json['statusCode'] !== 200)) {
            return [
                'success' => false,
                'error' => $json['statusDescription'] ?? 'Fawry payment initiation failed.',
                'raw' => is_array($json) ? $json : [],
            ];
        }

        return [
            'success' => true,
            'reference_number' => $json['referenceNumber'] ?? null,
            'transaction_id' => $json['fawryRefNumber'] ?? ($json['referenceNumber'] ?? null),
            'raw' => is_array($json) ? $json : [],
        ];
    }

    public function verifyCallback(array $payload, PaymentMethod $method): array
    {
        $config = $method->config ?? [];
        $securityKey = trim((string) ($config['security_key'] ?? ''));

        if ($securityKey === '') {
            return ['verified' => false, 'status' => 'failed'];
        }

        $fawryRef = (string) ($payload['fawryRefNumber'] ?? '');
        $merchantRef = (string) ($payload['merchantRefNumber'] ?? '');
        $paymentAmount = Money::toGateway((string) ($payload['paymentAmount'] ?? '0'));
        $orderAmount = Money::toGateway((string) ($payload['orderAmount'] ?? '0'));
        $orderStatus = (string) ($payload['orderStatus'] ?? '');
        $paymentMethod = (string) ($payload['paymentMethod'] ?? '');
        $paymentRefCode = (string) ($payload['paymentRefrenceCode'] ?? '');
        $receivedSig = strtolower((string) ($payload['messageSignature'] ?? ''));

        $expectedSig = hash(
            'sha256',
            $fawryRef.$merchantRef.$paymentAmount.$orderAmount.$orderStatus.$paymentMethod.$paymentRefCode.$securityKey
        );

        if ($receivedSig === '' || ! hash_equals($expectedSig, $receivedSig)) {
            return ['verified' => false, 'status' => 'failed'];
        }

        $normalized = match (strtoupper($orderStatus)) {
            'PAID' => 'completed',
            'NEW', 'UNPAID' => 'pending',
            default => 'failed',
        };

        return [
            'verified' => true,
            'order_number' => $merchantRef,
            'transaction_id' => $fawryRef ?: $paymentRefCode,
            'status' => $normalized,
            'amount' => $paymentAmount,
            'currency' => strtoupper(trim((string) ($payload['currencyCode'] ?? 'EGP'))) ?: 'EGP',
            'raw' => $payload,
        ];
    }

    public function refund(Order $order, PaymentMethod $method, string $amount, ?string $reason = null): array
    {
        $config = $method->config ?? [];
        if (empty($config['auto_refund'])) {
            return ['success' => false, 'error' => __('Auto-refund is disabled for Fawry.')];
        }

        $merchantCode = trim((string) ($config['merchant_code'] ?? ''));
        $securityKey = trim((string) ($config['security_key'] ?? ''));
        $referenceNumber = $order->payments()->where('status', 'completed')->latest()->value('transaction_reference');

        if ($merchantCode === '' || $securityKey === '' || ! $referenceNumber) {
            return ['success' => false, 'error' => __('Missing Fawry credentials or transaction reference.')];
        }

        $sandbox = (bool) ($config['sandbox'] ?? true);
        $baseUrl = $sandbox ? 'https://atfawry.fawrystaging.com' : 'https://www.atfawry.com';
        $refundAmount = Money::toGateway($amount);
        $reasonText = $reason ?: "Refund for order {$order->order_number}";
        $signature = hash('sha256', $merchantCode.$referenceNumber.$refundAmount.$reasonText.$securityKey);

        $response = Http::acceptJson()
            ->timeout(15)
            ->post("{$baseUrl}/ECommerceWeb/Fawry/payments/refund", [
                'merchantCode' => $merchantCode,
                'referenceNumber' => $referenceNumber,
                'refundAmount' => $refundAmount,
                'reason' => $reasonText,
                'signature' => $signature,
            ]);

        $json = $response->json();
        if (! $response->successful() || (isset($json['statusCode']) && (int) $json['statusCode'] !== 200)) {
            return [
                'success' => false,
                'error' => $json['statusDescription'] ?? __('Fawry refund failed.'),
                'raw' => is_array($json) ? $json : [],
            ];
        }

        return [
            'success' => true,
            'refund_id' => $json['fawryRefNumber'] ?? $referenceNumber,
            'raw' => is_array($json) ? $json : [],
        ];
    }
}
