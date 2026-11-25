<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingZone;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShippingZoneController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): Response
    {
        return Inertia::render('Admin/ShippingZones/Index', [
            'zones' => ShippingZone::query()->orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateZone($request);
        if (! empty($data['is_default'])) {
            ShippingZone::query()->update(['is_default' => false]);
        }

        $zone = ShippingZone::query()->create($data);
        $this->audit->log('shipping_zone.created', 'ShippingZone', $zone->id, null, ['name' => $zone->name]);

        return back()->with('success', __('Shipping zone created.'));
    }

    public function update(Request $request, ShippingZone $shippingZone): RedirectResponse
    {
        $data = $this->validateZone($request);
        if (! empty($data['is_default'])) {
            ShippingZone::query()->where('id', '!=', $shippingZone->id)->update(['is_default' => false]);
        }

        $shippingZone->update($data);
        $this->audit->log('shipping_zone.updated', 'ShippingZone', $shippingZone->id, null, ['name' => $shippingZone->name]);

        return back()->with('success', __('Shipping zone updated.'));
    }

    public function destroy(ShippingZone $shippingZone): RedirectResponse
    {
        $this->audit->log('shipping_zone.deleted', 'ShippingZone', $shippingZone->id, ['name' => $shippingZone->name], null);
        $shippingZone->delete();

        return back()->with('success', __('Shipping zone deleted.'));
    }

    private function validateZone(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'name_ar' => ['nullable', 'string', 'max:150'],
            'cities_text' => ['nullable', 'string', 'max:2000'],
            'rate' => ['required', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_days' => ['nullable', 'string', 'max:60'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $cities = collect(explode(',', (string) ($data['cities_text'] ?? '')))
            ->map(fn ($c) => trim($c))
            ->filter()
            ->values()
            ->all();

        unset($data['cities_text']);
        $data['cities'] = $cities;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        return $data;
    }
}
