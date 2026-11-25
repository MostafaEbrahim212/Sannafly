<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): Response
    {
        $customers = Customer::query()
            ->withCount(['orders', 'addresses', 'wishlists'])
            ->withSum('orders as total_spent', 'grand_total')
            ->when($search = $request->string('search')->trim()->toString(), function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => (object) $request->only('search'),
        ]);
    }

    public function toggleStatus(Customer $customer): RedirectResponse
    {
        $newStatus = $customer->status === 'active' ? 'suspended' : 'active';
        $customer->update(['status' => $newStatus]);

        $this->audit->log('customer.status_changed', 'Customer', $customer->id, null, ['status' => $newStatus]);

        return back()->with('success', __('Customer status updated.'));
    }
}
