<?php

namespace App\Services\Payments;

use App\Models\PaymentMethod;
use InvalidArgumentException;

class PaymentGatewayManager
{
    public function resolve(PaymentMethod $method): ?PaymentGatewayInterface
    {
        return match ($method->driver) {
            'myfatoorah' => app(MyFatoorahGateway::class),
            'fawry' => app(FawryGateway::class),
            'cash', 'bank_transfer', 'cod' => null,
            default => throw new InvalidArgumentException("Unsupported payment driver: {$method->driver}"),
        };
    }
}
