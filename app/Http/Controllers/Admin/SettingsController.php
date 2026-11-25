<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditLogger;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        $all = Setting::query()->where('type', '!=', 'secret')->get()->groupBy('group');

        return Inertia::render('Admin/Settings/Index', [
            'settingsGroups' => $all,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*.key' => ['required', 'string', 'max:100'],
            'items.*.value' => ['nullable'],
            'items.*.group' => ['required', 'string', 'max:60'],
            'items.*.type' => ['required', 'string', 'in:string,boolean,integer,json'],
            'items.*.is_public' => ['boolean'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['items'] as $item) {
                $this->settings->set(
                    $item['key'],
                    $item['value'] ?? '',
                    $item['group'],
                    $item['type'],
                    (bool) ($item['is_public'] ?? false)
                );
            }

            $this->audit->log('settings.updated', 'Setting', null, null, ['keys' => collect($data['items'])->pluck('key')->all()]);
        });

        return back()->with('success', __('Settings saved successfully.'));
    }

    public function customizer(): Response
    {
        return Inertia::render('Admin/Settings/Customizer', [
            'appearance' => $this->settings->byGroup('appearance'),
            'general' => $this->settings->byGroup('general'),
            'promotions' => $this->settings->byGroup('promotions'),
        ]);
    }
}
