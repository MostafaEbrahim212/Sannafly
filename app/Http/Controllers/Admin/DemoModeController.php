<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DemoModeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class DemoModeController extends Controller
{
    public function __construct(private readonly DemoModeService $demo) {}

    public function hub(): Response
    {
        return Inertia::render('Demo/Index', [
            'demoEnabled' => $this->demo->isEnabled(),
            'demoEmail' => DemoModeService::DEMO_EMAIL,
        ]);
    }

    public function loginAsDemo(Request $request): RedirectResponse
    {
        if (! $this->demo->isEnabled()) {
            abort(403, 'Demo Mode is not enabled.');
        }

        $demoUser = $this->demo->ensureDemoAccount();
        Auth::guard('web')->login($demoUser);
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard')->with('success', 'Signed in as Demo Reviewer (restricted permissions).');
    }

    public function toggle(Request $request): RedirectResponse
    {
        $enabled = $request->boolean('enabled');
        $this->demo->setEnabled($enabled);

        return back()->with('success', $enabled ? 'Demo Mode enabled.' : 'Demo Mode disabled.');
    }

    public function reset(): RedirectResponse
    {
        try {
            $this->demo->resetDemoData();

            return back()->with('success', 'Demo catalog data reset successfully.');
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
