<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\Health\SystemHealthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemHealthController extends Controller
{
    public function __construct(
        private readonly SystemHealthService $health,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/System/Health', [
            'report' => $this->health->runAll(),
        ]);
    }

    public function sendTestMail(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190'],
        ]);

        $res = $this->health->sendTestEmail($data['email']);
        $this->audit->log('system.health_test_mail', null, null, null, ['ok' => $res['ok']]);

        return back()->with($res['ok'] ? 'success' : 'error', $res['message']);
    }
}
