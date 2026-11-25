<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentMethod;

interface PaymentGatewayInterface
{
    /**
     * Initiate a payment with the gateway (runs outside DB transaction).
     *
     * @return array{success: bool, redirect_url?: string|null, reference_number?: string|null, transaction_id?: string|null, raw?: array, error?: string|null}
     */
    public function initiate(Order $order, PaymentMethod $method, string $returnUrl, string $callbackUrl): array;

    /**
     * Verify a gateway callback/webhook payload and return normalized status.
     *
     * @return array{verified: bool, order_number?: string|null, transaction_id?: string|null, status: string, raw?: array}
     */
    public function verifyCallback(array $payload, PaymentMethod $method): array;
}
