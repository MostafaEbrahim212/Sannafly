<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Policies/Index', [
            'policies' => $this->settings->byGroup('policies'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'policy_privacy' => ['nullable', 'string'],
            'policy_privacy_ar' => ['nullable', 'string'],
            'policy_privacy_highlights' => ['nullable', 'array'],
            'policy_terms' => ['nullable', 'string'],
            'policy_terms_ar' => ['nullable', 'string'],
            'policy_terms_highlights' => ['nullable', 'array'],
            'policy_refund' => ['nullable', 'string'],
            'policy_refund_ar' => ['nullable', 'string'],
            'policy_refund_highlights' => ['nullable', 'array'],
            'about_title' => ['nullable', 'string', 'max:200'],
            'about_title_ar' => ['nullable', 'string', 'max:200'],
            'about_body' => ['nullable', 'string'],
            'about_body_ar' => ['nullable', 'string'],
        ]);

        foreach ($data as $key => $value) {
            $type = is_array($value) ? 'json' : 'string';
            $this->settings->set($key, $value ?? '', 'policies', $type, true);
        }

        $this->audit->log('policies.updated', 'Setting', null, null, ['keys' => array_keys($data)]);

        return back()->with('success', __('Policies and storefront pages updated successfully.'));
    }
}
