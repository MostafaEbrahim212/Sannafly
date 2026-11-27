<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DemoModeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

class DemoModeController extends Controller
{
    public function __construct(private readonly DemoModeService $demo) {}

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
