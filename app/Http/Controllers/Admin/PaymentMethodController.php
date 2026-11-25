<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): Response
    {
        $methods = PaymentMethod::query()->orderBy('sort_order')->get()->map(function (PaymentMethod $pm) {
            $cfg = $pm->config ?? [];

            return [
                'id' => $pm->id,
                'name' => $pm->name,
                'name_ar' => $pm->name_ar,
                'code' => $pm->code,
                'driver' => $pm->driver,
                'description' => $pm->description,
                'description_ar' => $pm->description_ar,
                'is_active' => $pm->is_active,
                'is_visible' => $pm->is_visible,
                'sort_order' => $pm->sort_order,
                // Never expose secret keys to frontend; only expose safe flags & non-secret config
                'gateway_meta' => [
                    'sandbox' => (bool) ($cfg['sandbox'] ?? true),
                    'country' => $cfg['country'] ?? 'EGY',
                    'merchant_code' => $cfg['merchant_code'] ?? '',
                    'merchant_id' => $cfg['merchant_id'] ?? '',
                    'integration_id' => $cfg['integration_id'] ?? '',
                    'iframe_id' => $cfg['iframe_id'] ?? '',
                    'has_api_key' => ! empty($cfg['api_key']),
                    'has_security_key' => ! empty($cfg['security_key']),
                    'has_hmac_secret' => ! empty($cfg['hmac_secret']),
                    'bank_name' => $cfg['bank_name'] ?? '',
                    'account_name' => $cfg['account_name'] ?? '',
                    'account_number' => $cfg['account_number'] ?? '',
                    'iban' => $cfg['iban'] ?? '',
                    'pickup_address' => $cfg['pickup_address'] ?? '',
                    'pickup_hours' => $cfg['pickup_hours'] ?? '',
                ],
            ];
        });

        return Inertia::render('Admin/PaymentMethods/Index', [
            'paymentMethods' => $methods,
        ]);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'name_ar' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'description_ar' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'is_visible' => ['boolean'],
            'sort_order' => ['integer'],
            'sandbox' => ['nullable', 'boolean'],
            'country' => ['nullable', 'string', 'max:10'],
            'api_key' => ['nullable', 'string', 'max:1000'],
            'merchant_code' => ['nullable', 'string', 'max:120'],
            'security_key' => ['nullable', 'string', 'max:500'],
            'merchant_id' => ['nullable', 'string', 'max:120'],
            'integration_id' => ['nullable', 'string', 'max:120'],
            'iframe_id' => ['nullable', 'string', 'max:120'],
            'hmac_secret' => ['nullable', 'string', 'max:500'],
            'bank_name' => ['nullable', 'string', 'max:150'],
            'account_name' => ['nullable', 'string', 'max:150'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'iban' => ['nullable', 'string', 'max:100'],
            'pickup_address' => ['nullable', 'string', 'max:255'],
            'pickup_hours' => ['nullable', 'string', 'max:150'],
        ]);

        $existingConfig = $paymentMethod->config ?? [];
        $newConfig = $existingConfig;

        if ($paymentMethod->driver === 'myfatoorah') {
            $newConfig['sandbox'] = (bool) ($data['sandbox'] ?? $existingConfig['sandbox'] ?? true);
            $newConfig['country'] = strtoupper((string) ($data['country'] ?? $existingConfig['country'] ?? 'EGY'));
            if (! empty($data['api_key'])) {
                $newConfig['api_key'] = trim($data['api_key']);
            }
            if (! empty($data['is_active']) && empty($newConfig['api_key'])) {
                return back()->with('error', __('Please configure MyFatoorah API key before enabling it.'));
            }
        } elseif ($paymentMethod->driver === 'fawry') {
            $newConfig['sandbox'] = (bool) ($data['sandbox'] ?? $existingConfig['sandbox'] ?? true);
            if (array_key_exists('merchant_code', $data) && $data['merchant_code'] !== null) {
                $newConfig['merchant_code'] = trim((string) $data['merchant_code']);
            }
            if (! empty($data['security_key'])) {
                $newConfig['security_key'] = trim($data['security_key']);
            }
            if (! empty($data['is_active']) && (empty($newConfig['merchant_code']) || empty($newConfig['security_key']))) {
                return back()->with('error', __('Please configure Fawry merchant code and security key before enabling it.'));
            }
        } elseif ($paymentMethod->driver === 'paymob') {
            $newConfig['sandbox'] = (bool) ($data['sandbox'] ?? $existingConfig['sandbox'] ?? true);
            foreach (['integration_id', 'iframe_id'] as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== null) {
                    $newConfig[$field] = trim((string) $data[$field]);
                }
            }
            if (! empty($data['api_key'])) {
                $newConfig['api_key'] = trim($data['api_key']);
            }
            if (! empty($data['hmac_secret'])) {
                $newConfig['hmac_secret'] = trim($data['hmac_secret']);
            }
            if (! empty($data['is_active']) && (empty($newConfig['api_key']) || empty($newConfig['integration_id']) || empty($newConfig['iframe_id']))) {
                return back()->with('error', __('Please configure Paymob API key, Integration ID, and Iframe ID before enabling it.'));
            }
        } elseif ($paymentMethod->driver === 'kashier') {
            $newConfig['sandbox'] = (bool) ($data['sandbox'] ?? $existingConfig['sandbox'] ?? true);
            if (array_key_exists('merchant_id', $data) && $data['merchant_id'] !== null) {
                $newConfig['merchant_id'] = trim((string) $data['merchant_id']);
            }
            if (! empty($data['api_key'])) {
                $newConfig['api_key'] = trim($data['api_key']);
            }
            if (! empty($data['is_active']) && (empty($newConfig['merchant_id']) || empty($newConfig['api_key']))) {
                return back()->with('error', __('Please configure Kashier Merchant ID and API key before enabling it.'));
            }
        } elseif ($paymentMethod->driver === 'bank_transfer') {
            foreach (['bank_name', 'account_name', 'account_number', 'iban'] as $field) {
                if (array_key_exists($field, $data)) {
                    $newConfig[$field] = trim((string) ($data[$field] ?? ''));
                }
            }
        } elseif ($paymentMethod->driver === 'cash') {
            foreach (['pickup_address', 'pickup_hours'] as $field) {
                if (array_key_exists($field, $data)) {
                    $newConfig[$field] = trim((string) ($data[$field] ?? ''));
                }
            }
        }

        $paymentMethod->update([
            'name' => $data['name'],
            'name_ar' => $data['name_ar'] ?? $paymentMethod->name_ar,
            'description' => $data['description'] ?? $paymentMethod->description,
            'description_ar' => $data['description_ar'] ?? $paymentMethod->description_ar,
            'is_active' => (bool) ($data['is_active'] ?? $paymentMethod->is_active),
            'is_visible' => (bool) ($data['is_visible'] ?? $paymentMethod->is_visible),
            'sort_order' => (int) ($data['sort_order'] ?? $paymentMethod->sort_order),
            'config' => $newConfig,
        ]);

        $this->audit->log('payment_method.updated', 'PaymentMethod', $paymentMethod->id, null, [
            'driver' => $paymentMethod->driver,
            'is_active' => $paymentMethod->is_active,
            'sandbox' => $newConfig['sandbox'] ?? null,
        ]);

        return back()->with('success', __('Payment method updated.'));
    }
}
