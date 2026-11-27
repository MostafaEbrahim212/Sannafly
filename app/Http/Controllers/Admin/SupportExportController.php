<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportExport;
use App\Services\AuditLogger;
use App\Services\SupportDiagnosticService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SupportExportController extends Controller
{
    public function __construct(
        private readonly SupportDiagnosticService $diagnostics,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/System/Support', [
            'preview' => $this->diagnostics->buildReport(),
            'exports' => SupportExport::query()->with('creator:id,name')->latest('id')->limit(20)->get(),
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'format' => ['required', 'in:json,txt,zip'],
        ]);

        $export = $this->diagnostics->generateExport($data['format']);
        $this->audit->log('system.support_exported', 'SupportExport', $export->id, null, [
            'format' => $export->format,
            'filename' => $export->filename,
        ]);

        return back()->with('success', "Support diagnostic report generated: {$export->filename}");
    }

    public function download(SupportExport $export): BinaryFileResponse
    {
        try {
            $path = $this->diagnostics->resolvePath($export->filename);
        } catch (InvalidArgumentException) {
            abort(404);
        }

        return response()->download($path, basename($path));
    }

    public function destroy(SupportExport $export): RedirectResponse
    {
        $filename = $export->filename;
        $this->diagnostics->deleteExport($export);
        $this->audit->log('system.support_export_deleted', null, null, null, ['filename' => $filename]);

        return back()->with('success', "Export [{$filename}] deleted.");
    }
}
