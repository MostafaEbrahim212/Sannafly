<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'isAdminLogin' => false,
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ]);

        $throttleKey = 'customer|'.Str::transliterate(Str::lower($credentials['email']).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'email' => trans('auth.throttle', ['seconds' => $seconds, 'minutes' => ceil($seconds / 60)]),
            ]);
        }

        $customer = Customer::query()->where('email', $credentials['email'])->first();

        if (! $customer || ! Hash::check($credentials['password'], $customer->password) || ! $customer->isActive()) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages([
                'email' => __('These credentials do not match our records.'),
            ]);
        }

        RateLimiter::clear($throttleKey);

        Auth::guard('customer')->login($customer, (bool) ($credentials['remember'] ?? false));
        $request->session()->regenerate();

        $customer->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        return redirect()->intended('/');
    }

    public function showRegister(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $customer = DB::transaction(function () use ($data, $request) {
            return Customer::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => 'active',
                'password' => Hash::make($data['password']),
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);
        });

        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        return redirect('/')->with('success', __('Welcome! Your account has been created.'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function myOrders(Request $request): Response
    {
        $customer = Auth::guard('customer')->user();

        return Inertia::render('Storefront/MyOrders', [
            'orders' => $customer->orders()->with(['items', 'paymentMethod:id,name,name_ar'])->latest()->paginate(10),
        ]);
    }

    public function cancelOrder(Order $order, OrderService $orderService): RedirectResponse
    {
        $customerId = Auth::guard('customer')->id();
        if ((int) $order->customer_id !== (int) $customerId) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            return back()->with('error', __('Only pending orders can be cancelled.'));
        }

        $orderService->cancelOrder($order);

        return back()->with('success', __('Order cancelled and stock released.'));
    }
}
