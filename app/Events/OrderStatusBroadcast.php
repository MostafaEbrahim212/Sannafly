<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $orderId,
        public readonly string $orderNumber,
        public readonly string $status,
        public readonly string $paymentStatus,
        public readonly ?int $customerId = null,
        public readonly ?string $trackingNumber = null,
        public readonly ?string $shippingCarrier = null,
    ) {}

    public static function fromOrder(Order $order): self
    {
        return new self(
            orderId: $order->id,
            orderNumber: $order->order_number,
            status: $order->status,
            paymentStatus: $order->payment_status,
            customerId: $order->customer_id,
            trackingNumber: $order->tracking_number,
            shippingCarrier: $order->shipping_carrier,
        );
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('admin.realtime'),
            new PrivateChannel('orders.'.$this->orderNumber),
        ];

        if ($this->customerId !== null) {
            $channels[] = new PrivateChannel('App.Models.Customer.'.$this->customerId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.updated';
    }
}
