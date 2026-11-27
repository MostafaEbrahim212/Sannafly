<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LicenseActivation;
use App\Services\AuditLogger;
use App\Services\LicenseService;
use App\Services\UpdateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class LicenseController extends Controller
{
    public function __construct(
        private readonly LicenseService $licenses,
        private readonly UpdateService $updates,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/License/Index', [
            'license' => $this->licenses->status(),
            'history' => Schema::hasTable('license_activations')
                ? LicenseActivation::query()->latest('id')->limit(15)->get()
                : [],
            'updateInfo' => $this->updates->check(),
            'product' => [
                'name' => config('product.name'),
                'version' => config('product.version'),
                'edition' => config('product.edition'),
            ],
            'currentDomain' => request()->getHost(),
        ]);
    }

    public function activate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'license_key' => ['required', 'string', 'max:64'],
            'type' => ['required', 'in:single,multi,developer,lifetime,subscription'],
        ]);

        $result = $this->licenses->activate($data['license_key'], $data['type'], $request->getHost());
        if (! $result['ok']) {
            return back()->with('error', $result['message']);
        }

        $this->audit->log('license.activated', null, null, null, [
            'type' => $data['type'],
            'domain' => $request->getHost(),
        ]);

        return back()->with('success', $result['message']);
    }

    public function deactivate(): RedirectResponse
    {
        $this->licenses->deactivate();
        $this->audit->log('license.deactivated');

        return back()->with('success', 'License deactivated from this domain.');
    }
}
