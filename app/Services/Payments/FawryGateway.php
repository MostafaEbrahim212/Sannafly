<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Http;

class FawryGateway implements PaymentGatewayInterface
{
    public function initiate(Order $order, PaymentMethod $method, string $returnUrl, string $callbackUrl): array
    {
        $config = $method->config ?? [];
        $merchantCode = trim((string) ($config['merchant_code'] ?? ''));
        $securityKey = trim((string) ($config['security_key'] ?? ''));

        if ($merchantCode === '' || $securityKey === '') {
            return ['success' => false, 'error' => 'Fawry merchant code or security key is not configured.'];
        }

        $sandbox = (bool) ($config['sandbox'] ?? true);
        $baseUrl = $sandbox ? 'https://atfawry.fawrystaging.com' : 'https://www.atfawry.com';

        $merchantRefNum = $order->order_number;
        $customerProfileId = (string) ($order->user_id ?? 'guest');
        $paymentMethod = 'PAYATFAWRY';
        $amountFormatted = number_format((float) $order->grand_total, 2, '.', '');

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
        $paymentAmount = number_format((float) ($payload['paymentAmount'] ?? 0), 2, '.', '');
        $orderAmount = number_format((float) ($payload['orderAmount'] ?? 0), 2, '.', '');
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
            'raw' => $payload,
        ];
    }
}
