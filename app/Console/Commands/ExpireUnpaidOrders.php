<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\SettingsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireUnpaidOrders extends Command
{
    protected $signature = 'orders:expire-unpaid';

    protected $description = 'Cancel expired unpaid orders and release their reserved stock and coupons.';

    public function handle(SettingsService $settings, OrderService $orderService): int
    {
        $onlineTtl = (int) $settings->get('unpaid_online_ttl_minutes', 60);
        $bankTtl = (int) $settings->get('unpaid_bank_transfer_ttl_minutes', 1440);
        $codTtl = (int) $settings->get('unpaid_cod_ttl_minutes', 0);

        $buckets = [
            ['drivers' => ['fawry', 'myfatoorah'], 'ttl' => $onlineTtl],
            ['drivers' => ['bank_transfer'], 'ttl' => $bankTtl],
            ['drivers' => ['cod', 'cash'], 'ttl' => $codTtl],
        ];

        $expiredCount = 0;

        foreach ($buckets as $bucket) {
            if ($bucket['ttl'] <= 0) {
                continue;
            }

            $cutoff = now()->subMinutes($bucket['ttl']);

            $candidateIds = Order::query()
                ->where('status', 'pending')
                ->where('payment_status', 'unpaid')
                ->where('created_at', '<=', $cutoff)
                ->whereHas('paymentMethod', fn ($q) => $q->whereIn('driver', $bucket['drivers']))
                ->pluck('id');

            foreach ($candidateIds as $orderId) {
                $cancelled = DB::transaction(function () use ($orderId, $cutoff, $orderService): bool {
                    $order = Order::query()->whereKey($orderId)->lockForUpdate()->first();
                    if (! $order || $order->status !== 'pending' || $order->payment_status !== 'unpaid') {
                        return false;
                    }
                    if ($order->created_at && $order->created_at->gt($cutoff)) {
                        return false;
                    }

                    $orderService->cancelOrder($order);

                    return true;
                });

                if ($cancelled) {
                    $expiredCount++;
                }
            }
        }

        $this->info("Expired {$expiredCount} unpaid order(s).");

        return self::SUCCESS;
    }
}
