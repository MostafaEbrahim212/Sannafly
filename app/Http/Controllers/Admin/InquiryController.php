<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductInquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Inquiries/Index', [
            'inquiries' => ProductInquiry::query()->with(['product:id,name,sku'])->latest()->paginate(20),
        ]);
    }

    public function updateStatus(Request $request, ProductInquiry $inquiry): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['new', 'replied', 'closed'])],
        ]);
        $inquiry->update($data);

        return back()->with('success', __('Inquiry status updated.'));
    }
}
