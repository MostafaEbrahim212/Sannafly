<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Http;

class MyFatoorahGateway implements PaymentGatewayInterface
{
    public function initiate(Order $order, PaymentMethod $method, string $returnUrl, string $callbackUrl): array
    {
        $config = $method->config ?? [];
        $apiKey = $config['api_key'] ?? '';
        if ($apiKey === '') {
            return ['success' => false, 'error' => 'MyFatoorah API key is not configured.'];
        }

        $baseUrl = $this->baseUrl((bool) ($config['sandbox'] ?? true), $config['country'] ?? 'EGY');

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(15)
            ->post("{$baseUrl}/v2/SendPayment", [
                'NotificationOption' => 'LNK',
                'CustomerName' => $order->customer_name,
                'CustomerMobile' => preg_replace('/\D/', '', $order->customer_phone) ?: '0000000000',
                'CustomerEmail' => $order->customer_email ?: 'customer@example.com',
                'InvoiceValue' => round((float) $order->grand_total, 2),
                'DisplayCurrencyIso' => $order->currency ?: 'USD',
                'CallBackUrl' => $returnUrl,
                'ErrorUrl' => $returnUrl,
                'CustomerReference' => $order->order_number,
                'Language' => app()->getLocale() === 'ar' ? 'ar' : 'en',
            ]);

        $json = $response->json();
        if (! $response->successful() || empty($json['IsSuccess'])) {
            return [
                'success' => false,
                'error' => $json['Message'] ?? 'MyFatoorah payment initiation failed.',
                'raw' => is_array($json) ? $json : [],
            ];
        }

        return [
            'success' => true,
            'redirect_url' => $json['Data']['InvoiceURL'] ?? null,
            'transaction_id' => isset($json['Data']['InvoiceId']) ? (string) $json['Data']['InvoiceId'] : null,
            'raw' => $json['Data'] ?? [],
        ];
    }

    public function verifyCallback(array $payload, PaymentMethod $method): array
    {
        $config = $method->config ?? [];
        $apiKey = $config['api_key'] ?? '';
        $paymentId = $payload['paymentId'] ?? $payload['InvoiceId'] ?? null;

        if ($apiKey === '' || ! $paymentId) {
            return ['verified' => false, 'status' => 'failed'];
        }

        $baseUrl = $this->baseUrl((bool) ($config['sandbox'] ?? true), $config['country'] ?? 'EGY');

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(15)
            ->post("{$baseUrl}/v2/GetPaymentStatus", [
                'Key' => (string) $paymentId,
                'KeyType' => isset($payload['paymentId']) ? 'PaymentId' : 'InvoiceId',
            ]);

        $json = $response->json();
        if (! $response->successful() || empty($json['IsSuccess'])) {
            return ['verified' => false, 'status' => 'failed', 'raw' => is_array($json) ? $json : []];
        }

        $data = $json['Data'] ?? [];
        $invoiceStatus = strtolower((string) ($data['InvoiceStatus'] ?? ''));

        return [
            'verified' => true,
            'order_number' => $data['CustomerReference'] ?? null,
            'transaction_id' => isset($data['InvoiceId']) ? (string) $data['InvoiceId'] : (string) $paymentId,
            'status' => $invoiceStatus === 'paid' ? 'completed' : ($invoiceStatus === 'pending' ? 'pending' : 'failed'),
            'raw' => $data,
        ];
    }

    private function baseUrl(bool $sandbox, string $country): string
    {
        if ($sandbox) {
            return 'https://apitest.myfatoorah.com';
        }

        return match (strtoupper($country)) {
            'SAU' => 'https://api-sa.myfatoorah.com',
            'ARE' => 'https://api-ae.myfatoorah.com',
            'QAT' => 'https://api-qa.myfatoorah.com',
            'EGY' => 'https://api-eg.myfatoorah.com',
            default => 'https://api.myfatoorah.com',
        };
    }
}
