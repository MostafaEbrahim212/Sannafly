<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly RealtimeNotificationService $realtime,
    ) {}

    public function adjustStock(
        Product $product,
        int $quantityChange,
        string $type = 'adjustment',
        ?ProductVariation $variation = null,
        ?string $reason = null,
        ?string $referenceType = null,
        string|int|null $referenceId = null,
    ): StockMovement {
        return DB::transaction(function () use ($product, $quantityChange, $type, $variation, $reason, $referenceType, $referenceId) {
            $lockedProduct = Product::query()->lockForUpdate()->findOrFail($product->id);

            if ($variation) {
                $lockedVar = ProductVariation::query()
                    ->where('product_id', $lockedProduct->id)
                    ->lockForUpdate()
                    ->findOrFail($variation->id);

                $before = (int) $lockedVar->stock_quantity;
                $after = $before + $quantityChange;

                if ($after < 0 && ! $lockedProduct->allow_negative_stock) {
                    throw new RuntimeException("Insufficient stock for variation {$lockedVar->sku}.");
                }

                $lockedVar->update(['stock_quantity' => $after]);

                // Sync aggregate product stock
                $totalStock = (int) ProductVariation::query()
                    ->where('product_id', $lockedProduct->id)
                    ->where('status', 'active')
                    ->sum('stock_quantity');
                $lockedProduct->update(['stock_quantity' => $totalStock]);
            } else {
                $before = (int) $lockedProduct->stock_quantity;
                $after = $before + $quantityChange;

                if ($after < 0 && ! $lockedProduct->allow_negative_stock) {
                    throw new RuntimeException("Insufficient stock for product {$lockedProduct->sku}.");
                }

                $lockedProduct->update(['stock_quantity' => $after]);
            }

            $movement = StockMovement::query()->create([
                'product_id' => $lockedProduct->id,
                'variation_id' => $variation?->id,
                'user_id' => Auth::guard('web')->id(),
                'type' => $type,
                'quantity_change' => $quantityChange,
                'quantity_before' => $before,
                'quantity_after' => $after,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId !== null ? (string) $referenceId : null,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            $this->audit->log('inventory.adjusted', 'Product', $lockedProduct->id, [
                'variation_id' => $variation?->id,
                'stock' => $before,
            ], [
                'variation_id' => $variation?->id,
                'stock' => $after,
                'change' => $quantityChange,
                'type' => $type,
            ]);

            $currentStock = $variation ? $after : (int) $lockedProduct->stock_quantity;
            if ($quantityChange < 0 && $lockedProduct->track_inventory && $currentStock <= (int) $lockedProduct->low_stock_threshold) {
                $this->realtime->lowStockAlert($lockedProduct, $currentStock);
            }

            return $movement;
        });
    }
}
