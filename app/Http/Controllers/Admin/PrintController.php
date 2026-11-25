<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrintController extends Controller
{
    public function catalog(Request $request): Response
    {
        $products = Product::query()
            ->with(['category:id,name,name_ar', 'brand:id,name,name_ar', 'images', 'prices.priceType'])
            ->when($request->string('ids')->trim()->toString(), fn ($q, $ids) => $q->whereIn('id', explode(',', $ids)))
            ->when($request->string('status')->trim()->toString(), fn ($q, $s) => $q->where('status', $s))
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Print/CatalogPrint', [
            'products' => $products,
            'template' => $request->string('template')->toString() ?: 'catalog', // catalog | price_list | stock_report | labels
        ]);
    }

    public function product(Product $product): Response
    {
        $product->load(['category', 'brand', 'images', 'prices.priceType', 'variations.options.attribute']);

        return Inertia::render('Admin/Print/ProductPrint', [
            'product' => $product,
        ]);
    }
}
