<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerAddress;
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
