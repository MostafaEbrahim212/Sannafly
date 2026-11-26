<?php

namespace App\Services;

use App\Events\AdminRealtimeAlert;
use App\Events\OrderStatusBroadcast;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductInquiry;
use App\Models\User;
use App\Notifications\SystemAlertNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RealtimeNotificationService
{
    /**
     * Notify active admin dashboard users and broadcast an admin realtime event.
     *
     * @param  array<string, mixed>  $meta
     */
    public function notifyAdmins(
        string $category,
        string $titleEn,
        string $titleAr,
        string $bodyEn,
        string $bodyAr,
        string $url,
        array $meta = [],
    ): void {
        if (! Schema::hasTable('notifications')) {
            return;
        }

        try {
            $admins = User::query()
                ->where('status', 'active')
                ->whereHas('roles', static function ($q): void {
                    $q->whereIn('slug', ['super-admin', 'admin'])
                        ->orWhereHas('permissions', static fn ($p) => $p->where('slug', 'dashboard.access'));
                })
                ->get();

            if ($admins->isNotEmpty()) {
                Notification::send($admins, new SystemAlertNotification(
                    category: $category,
                    titleEn: $titleEn,
                    titleAr: $titleAr,
                    bodyEn: $bodyEn,
                    bodyAr: $bodyAr,
                    url: $url,
                    meta: $meta,
                ));
            }
        } catch (Throwable) {
            // Never block checkout/order flow if notification persistence fails
        }

        $this->safeBroadcast(new AdminRealtimeAlert(
            category: $category,
            titleEn: $titleEn,
            titleAr: $titleAr,
            bodyEn: $bodyEn,
            bodyAr: $bodyAr,
            url: $url,
            meta: $meta,
        ));
    }

    /**
     * Notify an authenticated customer and broadcast the order update.
     *
     * @param  array<string, mixed>  $meta
     */
    public function notifyCustomerOrder(
        Order $order,
        string $category,
        string $titleEn,
        string $titleAr,
        string $bodyEn,
        string $bodyAr,
        array $meta = [],
    ): void {
        if (Schema::hasTable('notifications') && $order->customer_id) {
            try {
                $customer = $order->customer;
                if ($customer) {
                    $customer->notify(new SystemAlertNotification(
                        category: $category,
                        titleEn: $titleEn,
                        titleAr: $titleAr,
                        bodyEn: $bodyEn,
                        bodyAr: $bodyAr,
                        url: "/orders/{$order->order_number}/confirmation",
                        meta: array_merge([
                            'order_id' => $order->id,
                            'order_number' => $order->order_number,
                            'status' => $order->status,
                            'payment_status' => $order->payment_status,
                        ], $meta),
                    ));
                }
            } catch (Throwable) {
                // Non-fatal
            }
        }

        $this->safeBroadcast(OrderStatusBroadcast::fromOrder($order));
    }

    public function orderPlaced(Order $order): void
    {
        $total = number_format((float) $order->grand_total, 2).' '.($order->currency ?: 'EGP');

        $this->notifyAdmins(
            category: 'order',
            titleEn: "New Order #{$order->order_number}",
            titleAr: "طلب جديد #{$order->order_number}",
            bodyEn: "{$order->customer_name} placed an order ({$total}).",
            bodyAr: "قام {$order->customer_name} بإنشاء طلب بقيمة {$total}.",
            url: "/admin/orders/{$order->id}",
            meta: [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
            ],
        );

        $this->notifyCustomerOrder(
            order: $order,
            category: 'order',
            titleEn: "Order #{$order->order_number} Received",
            titleAr: "تم استلام طلبك #{$order->order_number}",
            bodyEn: "We received your order ({$total}) and will keep you updated.",
            bodyAr: "تم استلام طلبك بقيمة {$total} وسنوافيك بتحديثات الحالة أولًا بأول.",
        );
    }

    public function orderStatusChanged(Order $order, string $oldStatus): void
    {
        $statusLabelsAr = [
            'pending' => 'قيد الانتظار',
            'confirmed' => 'تم التأكيد',
            'processing' => 'قيد التجهيز',
            'shipped' => 'تم الشحن',
            'delivered' => 'تم التسليم',
            'cancelled' => 'ملغي',
            'returned' => 'مرتجع',
            'refunded' => 'مسترد',
        ];
        $arStatus = $statusLabelsAr[$order->status] ?? $order->status;
        $enStatus = ucfirst($order->status);

        $this->notifyAdmins(
            category: 'order',
            titleEn: "Order #{$order->order_number} → {$enStatus}",
            titleAr: "تحديث الطلب #{$order->order_number} ← {$arStatus}",
            bodyEn: "Order status changed from {$oldStatus} to {$order->status}.",
            bodyAr: "تغيرت حالة الطلب إلى {$arStatus}.",
            url: "/admin/orders/{$order->id}",
            meta: [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
            ],
        );

        $trackingNoteEn = $order->tracking_number ? " Tracking: {$order->tracking_number}." : '';
        $trackingNoteAr = $order->tracking_number ? " رقم التتبع: {$order->tracking_number}." : '';

        $this->notifyCustomerOrder(
            order: $order,
            category: 'order',
            titleEn: "Order #{$order->order_number}: {$enStatus}",
            titleAr: "تحديث طلبك #{$order->order_number}: {$arStatus}",
            bodyEn: "Your order is now {$enStatus}.{$trackingNoteEn}",
            bodyAr: "أصبحت حالة طلبك الآن: {$arStatus}.{$trackingNoteAr}",
        );
    }

    public function paymentOutcome(Order $order, string $outcome): void
    {
        $isPaid = $outcome === 'paid';
        $isReview = in_array($outcome, ['needs_review', 'amount_mismatch'], true);

        $titleEn = $isPaid
            ? "Payment Confirmed #{$order->order_number}"
            : ($isReview ? "Payment Needs Review #{$order->order_number}" : "Payment Failed #{$order->order_number}");

        $titleAr = $isPaid
            ? "تم تأكيد الدفع #{$order->order_number}"
            : ($isReview ? "دفعة تحتاج مراجعة #{$order->order_number}" : "فشل الدفع #{$order->order_number}");

        $bodyEn = "Payment status updated to {$outcome}.";
        $bodyAr = $isPaid
            ? 'تم تحصيل قيمة الطلب بنجاح.'
            : ($isReview ? 'يرجى مراجعة مبلغ أو إيصال الدفع في تفاصيل الطلب.' : 'لم تكتمل عملية الدفع للطلب.');

        $this->notifyAdmins(
            category: 'payment',
            titleEn: $titleEn,
            titleAr: $titleAr,
            bodyEn: $bodyEn,
            bodyAr: $bodyAr,
            url: "/admin/orders/{$order->id}",
            meta: [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'payment_status' => $order->payment_status,
            ],
        );

        $this->notifyCustomerOrder(
            order: $order,
            category: 'payment',
            titleEn: $titleEn,
            titleAr: $titleAr,
            bodyEn: $isPaid ? 'Your payment was confirmed successfully.' : ($isReview ? 'Your payment is under verification.' : 'Your payment could not be completed. You can retry from your order page.'),
            bodyAr: $isPaid ? 'تم تأكيد عملية الدفع بنجاح.' : ($isReview ? 'عملية الدفع قيد المراجعة حاليًا.' : 'لم تكتمل عملية الدفع، يمكنك إعادة المحاولة من صفحة الطلب.'),
        );
    }

    public function lowStockAlert(Product $product, int $newStock): void
    {
        $this->notifyAdmins(
            category: 'inventory',
            titleEn: "Low Stock: {$product->name}",
            titleAr: 'تنبيه نقص مخزون: '.($product->name_ar ?: $product->name),
            bodyEn: "Remaining stock is {$newStock} (threshold: {$product->low_stock_threshold}).",
            bodyAr: "الكمية المتبقية {$newStock} (حد التنبيه: {$product->low_stock_threshold}).",
            url: '/admin/inventory',
            meta: [
                'product_id' => $product->id,
                'stock_quantity' => $newStock,
            ],
        );
    }

    public function inquiryReceived(ProductInquiry $inquiry): void
    {
        $this->notifyAdmins(
            category: 'inquiry',
            titleEn: "New Inquiry from {$inquiry->name}",
            titleAr: "استفسار جديد من {$inquiry->name}",
            bodyEn: mb_substr((string) $inquiry->message, 0, 120),
            bodyAr: mb_substr((string) $inquiry->message, 0, 120),
            url: '/admin/inquiries',
            meta: ['inquiry_id' => $inquiry->id],
        );
    }

    private function safeBroadcast(object $event): void
    {
        try {
            if (config('broadcasting.default', 'null') !== 'null') {
                event($event);
            }
        } catch (Throwable) {
            // Do not break requests if broadcaster server (Reverb/Pusher) is offline
        }
    }
}
