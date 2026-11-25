<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Order $order,
        public readonly bool $isNewOrder = false,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->isNewOrder
            ? "Order Confirmed: {$this->order->order_number}"
            : "Order {$this->order->order_number} - Status Updated to ".ucfirst($this->order->status);

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$this->order->customer_name},");

        if ($this->isNewOrder) {
            $mail->line("Thank you for your order! Your order **{$this->order->order_number}** has been received.");
        } else {
            $mail->line("Your order **{$this->order->order_number}** status is now **".strtoupper($this->order->status).'**.');
        }

        $mail->line('Total: '.number_format((float) $this->order->grand_total, 2)." {$this->order->currency}")
            ->line('Payment Status: '.ucfirst($this->order->payment_status))
            ->action('Track Your Order', url("/orders/confirmation/{$this->order->order_number}"))
            ->line('Thank you for shopping with us!');

        return $mail;
    }
}
