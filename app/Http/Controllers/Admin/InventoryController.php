<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockMovement;
use App\Services\InventoryService;
use App\Support\ErrorLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    public function index(Request $request): Response
    {
        $products = Product::query()
            ->with(['category:id,name,name_ar', 'variations'])
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('stock_quantity', '<=', 'low_stock_threshold'))
            ->when($search = $request->string('search')->trim()->toString(), fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"))
            ->orderBy('stock_quantity')
            ->paginate(20)
            ->withQueryString();

        $movements = StockMovement::query()
            ->with(['product:id,name,sku', 'variation:id,sku,name', 'user:id,name'])
            ->latest('created_at')
            ->limit(30)
            ->get();

        return Inertia::render('Admin/Inventory/Index', [
            'products' => $products,
            'movements' => $movements,
            'filters' => (object) $request->only(['search', 'low_stock']),
        ]);
    }

    public function adjust(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'quantity_change' => ['required', 'integer', 'not_in:0'],
            'variation_id' => ['nullable', 'integer', 'exists:product_variations,id'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $variation = isset($data['variation_id'])
            ? ProductVariation::query()->where('product_id', $product->id)->findOrFail($data['variation_id'])
            : null;

        try {
            $this->inventoryService->adjustStock(
                $product,
                (int) $data['quantity_change'],
                'adjustment',
                $variation,
                $data['reason'] ?? 'Manual adjustment'
            );
        } catch (\RuntimeException $e) {
            ErrorLogger::warning('inventory.adjustment_failed', $e, $request, [
                'product_id' => $product->id,
                'variation_id' => $variation?->id,
                'quantity_change' => (int) $data['quantity_change'],
            ]);

            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('Stock adjusted successfully.'));
    }
}
