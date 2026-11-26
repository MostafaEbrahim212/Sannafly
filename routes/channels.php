<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('admin.realtime', function ($user): bool {
    return $user instanceof User && $user->isActive() && ($user->isSuperAdmin() || $user->hasPermission('dashboard.access'));
});

Broadcast::channel('App.Models.User.{id}', function ($user, int $id): bool {
    return $user instanceof User && (int) $user->id === $id;
});

Broadcast::channel('App.Models.Customer.{id}', function ($user, int $id): bool {
    return $user instanceof Customer && (int) $user->id === $id;
});

Broadcast::channel('orders.{orderNumber}', function ($user, string $orderNumber): bool {
    if ($user instanceof User && $user->isActive()) {
        return true;
    }

    if ($user instanceof Customer) {
        return Order::query()
            ->where('order_number', $orderNumber)
            ->where('customer_id', $user->id)
            ->exists();
    }

    return false;
});
