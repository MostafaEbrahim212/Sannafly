<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Support\Money;
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

        $currency = strtoupper(trim((string) ($order->currency ?: 'EGP')));
        $supportedCurrencies = ['KWD', 'SAR', 'BHD', 'AED', 'QAR', 'OMR', 'JOD', 'EGP', 'USD', 'EUR', 'GBP'];
        if (! in_array($currency, $supportedCurrencies, true)) {
            return ['success' => false, 'error' => __('Unsupported currency for MyFatoorah.')];
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
                'InvoiceValue' => Money::toGateway((string) $order->grand_total),
                'DisplayCurrencyIso' => $currency,
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

        [$amount, $currency] = $this->extractAmountAndCurrency($data);

        return [
            'verified' => true,
            'order_number' => $data['CustomerReference'] ?? null,
            'transaction_id' => isset($data['InvoiceId']) ? (string) $data['InvoiceId'] : (string) $paymentId,
            'status' => $invoiceStatus === 'paid' ? 'completed' : ($invoiceStatus === 'pending' ? 'pending' : 'failed'),
            'amount' => $amount,
            'currency' => $currency,
            'raw' => $data,
        ];
    }

    /**
     * Extract normalized gateway amount and ISO currency from MyFatoorah GetPaymentStatus Data.
     *
     * MyFatoorah sandbox/multi-currency accounts convert InvoiceValue into the merchant's
     * settlement currency (e.g. KWD/KD) while preserving the customer-facing display amount
     * and currency in InvoiceDisplayValue (e.g. "159.000 LE").
     *
     * @return array{0: ?string, 1: ?string}
     */
    private function extractAmountAndCurrency(array $data): array
    {
        $explicitIso = $data['DisplayCurrencyIso'] ?? null;
        if (is_string($explicitIso) && trim($explicitIso) !== '') {
            $rawAmount = $data['InvoiceValue'] ?? null;
            $amount = $rawAmount !== null && $rawAmount !== '' ? Money::toGateway((string) $rawAmount) : null;

            return [$amount, strtoupper(trim($explicitIso))];
        }

        $displayValue = $data['InvoiceDisplayValue'] ?? null;
        if (is_string($displayValue) && preg_match('/^\s*([\d,]+(?:\.\d+)?)\s*([A-Za-z\p{Arabic}\$€£]+)\s*$/u', $displayValue, $matches)) {
            $numeric = str_replace(',', '', $matches[1]);
            $symbol = strtoupper(trim($matches[2]));
            $currencyMap = [
                'LE' => 'EGP',
                'EGP' => 'EGP',
                'E£' => 'EGP',
                'ج.م' => 'EGP',
                'KD' => 'KWD',
                'KWD' => 'KWD',
                'SR' => 'SAR',
                'SAR' => 'SAR',
                'AED' => 'AED',
                'BD' => 'BHD',
                'BHD' => 'BHD',
                'QR' => 'QAR',
                'QAR' => 'QAR',
                'OR' => 'OMR',
                'OMR' => 'OMR',
                'JD' => 'JOD',
                'JOD' => 'JOD',
                'USD' => 'USD',
                '$' => 'USD',
                'EUR' => 'EUR',
                '€' => 'EUR',
                'GBP' => 'GBP',
                '£' => 'GBP',
            ];

            $mappedCurrency = $currencyMap[$symbol] ?? (strlen($symbol) === 3 ? $symbol : null);
            if ($mappedCurrency !== null) {
                return [Money::toGateway($numeric), $mappedCurrency];
            }
        }

        $rawAmount = $data['InvoiceValue'] ?? null;
        $amount = $rawAmount !== null && $rawAmount !== '' ? Money::toGateway((string) $rawAmount) : null;
        $txCurrency = $data['InvoiceTransactions'][0]['Currency'] ?? null;

        return [
            $amount,
            is_string($txCurrency) && trim($txCurrency) !== '' ? strtoupper(trim($txCurrency)) : null,
        ];
    }

    public function refund(Order $order, PaymentMethod $method, string $amount, ?string $reason = null): array
    {
        $config = $method->config ?? [];
        if (empty($config['auto_refund'])) {
            return ['success' => false, 'error' => __('Auto-refund is disabled for MyFatoorah.')];
        }

        $apiKey = (string) ($config['api_key'] ?? '');
        $invoiceId = $order->payments()->where('status', 'completed')->latest()->value('transaction_reference');
        if ($apiKey === '' || ! $invoiceId) {
            return ['success' => false, 'error' => __('Missing MyFatoorah API key or invoice reference.')];
        }

        $baseUrl = $this->baseUrl((bool) ($config['sandbox'] ?? true), $config['country'] ?? 'EGY');

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(15)
            ->post("{$baseUrl}/v2/MakeRefund", [
                'KeyType' => 'InvoiceId',
                'Key' => (string) $invoiceId,
                'RefundChargeOnCustomer' => false,
                'ServiceChargeOnCustomer' => false,
                'Amount' => Money::toGateway($amount),
                'Comment' => $reason ?: "Refund for order {$order->order_number}",
            ]);

        $json = $response->json();
        if (! $response->successful() || empty($json['IsSuccess'])) {
            return [
                'success' => false,
                'error' => $json['Message'] ?? __('MyFatoorah refund failed.'),
                'raw' => is_array($json) ? $json : [],
            ];
        }

        return [
            'success' => true,
            'refund_id' => isset($json['Data']['RefundId']) ? (string) $json['Data']['RefundId'] : (string) $invoiceId,
            'raw' => $json['Data'] ?? [],
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
