<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ThemePreset;
use App\Services\ThemePresetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ThemePresetController extends Controller
{
    public function __construct(private readonly ThemePresetService $presets) {}

    public function index(): Response
    {
        $this->presets->ensureDefaults();

        return Inertia::render('Admin/Settings/Themes', [
            'presets' => ThemePreset::query()->orderByDesc('is_system')->orderBy('name')->get(),
        ]);
    }

    public function apply(ThemePreset $preset): RedirectResponse
    {
        $this->presets->applyPreset($preset);

        return back()->with('success', "Theme preset [{$preset->name}] applied safely.");
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'name_ar' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:60'],
        ]);

        $this->presets->saveCurrentAsPreset($data['name'], $data['name_ar'] ?? null, $data['category'] ?? 'custom');

        return back()->with('success', "Current theme saved as preset [{$data['name']}].");
    }

    public function export(ThemePreset $preset): JsonResponse
    {
        return response()->json([
            'name' => $preset->name,
            'name_ar' => $preset->name_ar,
            'category' => $preset->category,
            'description' => $preset->description,
            'config' => $preset->config,
        ], 200, [
            'Content-Disposition' => 'attachment; filename="theme-'.$preset->slug.'.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'theme_json' => ['required', 'string', 'max:20000'],
        ]);

        $decoded = json_decode($request->string('theme_json')->toString(), true);
        if (! is_array($decoded)) {
            return back()->with('error', 'Invalid JSON format.');
        }

        try {
            $preset = $this->presets->importFromArray($decoded);

            return back()->with('success', "Theme preset [{$preset->name}] imported.");
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function destroy(ThemePreset $preset): RedirectResponse
    {
        if ($preset->is_system) {
            return back()->with('error', 'System presets cannot be deleted.');
        }
        $preset->delete();

        return back()->with('success', 'Custom preset deleted.');
    }
}
