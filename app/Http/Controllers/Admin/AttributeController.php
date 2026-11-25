<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\AttributeOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttributeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Attributes/Index', [
            'attributes' => Attribute::query()->with('options')->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'name_ar' => ['nullable', 'string', 'max:100'],
            'type' => ['required', Rule::in(['select', 'color', 'text'])],
        ]);

        Attribute::query()->create([
            ...$data,
            'slug' => Str::slug($data['name']).'-'.Str::random(4),
        ]);

        return back()->with('success', __('Attribute created.'));
    }

    /**
     * Inline quick-create attribute + options from the Product Wizard without leaving the page.
     */
    public function quickStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(['select', 'color', 'text'])],
            'options' => ['required', 'array', 'min:1'],
            'options.*' => ['required', 'string', 'max:100'],
        ]);

        $attribute = DB::transaction(function () use ($data) {
            $attr = Attribute::query()->firstOrCreate(
                ['slug' => Str::slug($data['name'])],
                ['name' => $data['name'], 'type' => $data['type'] ?? 'select']
            );

            foreach ($data['options'] as $idx => $val) {
                $attr->options()->firstOrCreate(
                    ['value' => trim($val)],
                    ['sort_order' => $idx]
                );
            }

            return $attr->load('options');
        });

        return response()->json(['attribute' => $attribute]);
    }

    public function storeOption(Request $request, Attribute $attribute): RedirectResponse
    {
        $data = $request->validate([
            'value' => ['required', 'string', 'max:100'],
            'value_ar' => ['nullable', 'string', 'max:100'],
            'color_hex' => ['nullable', 'string', 'max:20'],
        ]);

        $attribute->options()->create($data);

        return back()->with('success', __('Option added.'));
    }

    public function destroyOption(AttributeOption $option): RedirectResponse
    {
        $option->delete();

        return back()->with('success', __('Option removed.'));
    }
}
