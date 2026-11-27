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

    public function presentation(): Response
    {
        $user = Auth::guard('web')->user();
        $isPresenter = $user !== null && ! $user->roles()->where('slug', 'demo-reviewer')->exists();

        $presenterNotes = $isPresenter ? [
            'opening' => 'Ask the prospect about their current catalog size and whether they sell online or only take WhatsApp/catalog inquiries.',
            'storefront' => 'Highlight RTL Arabic + Dark Mode toggle live — clients in Egypt & GCC immediately notice native Arabic quality.',
            'dashboard' => 'Point out the low-stock alerts and realtime notification bell; keep it under 60 seconds.',
            'products' => 'Mention that the 5-step wizard prevents staff from forgetting SKUs, images, or Arabic titles.',
            'categories' => 'Show how parent/child categories power storefront filters automatically.',
            'customization' => 'Remind the buyer that every client deployment can look completely different without touching code.',
            'orders' => 'Emphasize the Order State Machine: cancelling an order automatically returns reserved stock.',
            'payments' => 'Clarify clearly: online gateways (Paymob, Fawry, MyFatoorah, Kashier) are simulated in Demo Mode and require client API keys in production.',
            'reports' => 'Show CSV export for accounting teams.',
            'productivity' => 'Highlight XLSX/CSV bulk import with pre-import preview so migrating 500+ products is painless.',
            'security' => 'Mention built-in /install wizard, backups, health checks, and commercial licensing for agencies selling to multiple clients.',
        ] : null;

        return Inertia::render('Demo/Presentation', [
            'demoEnabled' => $this->demo->isEnabled(),
            'isPresenter' => $isPresenter,
            'presenterNotes' => $presenterNotes,
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
