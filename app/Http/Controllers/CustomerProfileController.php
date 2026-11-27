<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerProfileController extends Controller
{
    public function show(): Response
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();

        return Inertia::render('Storefront/Profile', [
            'customer' => $customer->only(['id', 'name', 'email', 'phone', 'last_login_at', 'created_at']),
            'addresses' => $customer->addresses()->get(),
            'ordersCount' => $customer->orders()->count(),
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $customer->update($data);

        return back()->with('success', __('Profile updated successfully.'));
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        if (! Hash::check($data['current_password'], $customer->password)) {
            return back()->withErrors(['current_password' => __('The current password is incorrect.')]);
        }

        $customer->update(['password' => Hash::make($data['password'])]);
        $request->session()->regenerate();

        return back()->with('success', __('Password updated successfully.'));
    }

    public function storeAddress(Request $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();

        $data = $this->validateAddress($request);

        DB::transaction(function () use ($customer, $data) {
            $isDefault = (bool) ($data['is_default'] ?? false) || ! $customer->addresses()->exists();
            if ($isDefault) {
                $customer->addresses()->update(['is_default' => false]);
            }

            $customer->addresses()->create([
                ...$data,
                'is_default' => $isDefault,
            ]);
        });

        return back()->with('success', __('Address added successfully.'));
    }

    public function updateAddress(Request $request, CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        if ($address->customer_id !== $customer->id) {
            abort(403);
        }

        $data = $this->validateAddress($request);

        DB::transaction(function () use ($customer, $address, $data) {
            if (! empty($data['is_default'])) {
                $customer->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            $address->update($data);
        });

        return back()->with('success', __('Address updated successfully.'));
    }

    public function setDefaultAddress(CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        if ($address->customer_id !== $customer->id) {
            abort(403);
        }

        DB::transaction(function () use ($customer, $address) {
            $customer->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return back()->with('success', __('Default address updated.'));
    }

    public function destroyAddress(CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        if ($address->customer_id !== $customer->id) {
            abort(403);
        }

        $address->delete();

        return back()->with('success', __('Address removed.'));
    }

    /**
     * Export authenticated customer's personal data (GDPR-style portability).
     */
    public function exportData(): JsonResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        $customer->load(['addresses', 'orders.items']);

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'profile' => [
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'created_at' => $customer->created_at?->toIso8601String(),
            ],
            'addresses' => $customer->addresses->toArray(),
            'orders' => $customer->orders->map(fn ($o) => [
                'order_number' => $o->order_number,
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'grand_total' => $o->grand_total,
                'currency' => $o->currency,
                'created_at' => $o->created_at?->toIso8601String(),
            ])->all(),
        ];

        return response()->json($payload, 200, [
            'Content-Disposition' => 'attachment; filename="my-personal-data.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Anonymize and deactivate customer account while preserving order financial records.
     */
    public function anonymizeAccount(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        if (! Hash::check($request->string('password')->toString(), (string) $customer->password)) {
            return back()->with('error', __('Invalid password.'));
        }

        DB::transaction(function () use ($customer): void {
            $customer->addresses()->delete();
            $customer->wishlists()->delete();
            $customer->orders()->update([
                'customer_name' => 'Deleted Customer',
                'customer_email' => 'anonymized@deleted.invalid',
                'customer_phone' => '0000000000',
            ]);
            $customer->update([
                'name' => 'Deleted Customer',
                'email' => "deleted_{$customer->id}_".time().'@deleted.invalid',
                'phone' => null,
                'status' => 'inactive',
            ]);
            $customer->delete();
        });

        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', __('Your account and personal data have been anonymized.'));
    }

    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:60'],
            'recipient_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'country' => ['nullable', 'string', 'max:80'],
            'city' => ['required', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'street' => ['required', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:60'],
            'floor' => ['nullable', 'string', 'max:30'],
            'apartment' => ['nullable', 'string', 'max:30'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_default' => ['boolean'],
        ]);
    }
}
