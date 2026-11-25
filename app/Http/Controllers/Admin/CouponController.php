<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => Coupon::query()->latest()->paginate(20),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateCoupon($request);
        $data['code'] = strtoupper(trim($data['code']));

        $coupon = Coupon::query()->create($data);
        $this->audit->log('coupon.created', 'Coupon', $coupon->id, null, ['code' => $coupon->code]);

        return back()->with('success', __('Coupon created successfully.'));
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $data = $this->validateCoupon($request, $coupon->id);
        $data['code'] = strtoupper(trim($data['code']));

        $coupon->update($data);
        $this->audit->log('coupon.updated', 'Coupon', $coupon->id, null, ['code' => $coupon->code]);

        return back()->with('success', __('Coupon updated successfully.'));
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $this->audit->log('coupon.deleted', 'Coupon', $coupon->id, ['code' => $coupon->code], null);
        $coupon->delete();

        return back()->with('success', __('Coupon deleted.'));
    }

    private function validateCoupon(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:64', 'unique:coupons,code,'.($ignoreId ?? 'NULL')],
            'name' => ['nullable', 'string', 'max:150'],
            'type' => ['required', 'in:percent,fixed'],
            'value' => ['required', 'numeric', 'min:0.01'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ]);
    }
}
