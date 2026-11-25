<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Services\AuditLogger;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function __construct(
        private readonly ImageService $imageService,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Brands/Index', [
            'brands' => Brand::query()->withCount('products')->orderBy('sort_order')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:brands,slug'],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'website' => ['nullable', 'url', 'max:255'],
            'is_visible' => ['boolean'],
            'sort_order' => ['integer'],
            'logo' => ['nullable', 'image', 'max:4096'],
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['name']).'-'.Str::random(4);
        if ($request->hasFile('logo')) {
            $stored = $this->imageService->processAndStore($request->file('logo'), 'brands');
            $data['logo'] = $stored['path'];
        }

        $brand = Brand::query()->create($data);
        $this->audit->log('brand.created', 'Brand', $brand->id, null, ['name' => $brand->name]);

        return back()->with('success', __('Brand created successfully.'));
    }

    public function update(Request $request, Brand $brand): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('brands', 'slug')->ignore($brand->id)],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'website' => ['nullable', 'url', 'max:255'],
            'is_visible' => ['boolean'],
            'sort_order' => ['integer'],
            'logo' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('logo')) {
            $stored = $this->imageService->processAndStore($request->file('logo'), 'brands');
            $data['logo'] = $stored['path'];
        }

        $brand->update($data);
        $this->audit->log('brand.updated', 'Brand', $brand->id);

        return back()->with('success', __('Brand updated successfully.'));
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();
        $this->audit->log('brand.deleted', 'Brand', $brand->id);

        return back()->with('success', __('Brand deleted.'));
    }
}
