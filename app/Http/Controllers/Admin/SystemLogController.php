<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\SystemLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SystemLogController extends Controller
{
    public function __construct(
        private readonly SystemLogService $logService,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): Response
    {
        $files = $this->logService->listFiles();
        $requestedFile = $request->string('file')->toString();
        $activeFile = $requestedFile !== '' ? $requestedFile : ($files[0]['name'] ?? null);

        $parsed = [
            'entries' => [],
            'counts' => ['ALL' => 0],
            'truncated' => false,
        ];

        if ($activeFile !== null) {
            try {
                $parsed = $this->logService->parseFile(
                    $activeFile,
                    $request->string('level')->toString(),
                    $request->string('search')->toString()
                );
            } catch (InvalidArgumentException) {
                $activeFile = $files[0]['name'] ?? null;
                if ($activeFile !== null) {
                    $parsed = $this->logService->parseFile($activeFile);
                }
            }
        }

        return Inertia::render('Admin/SystemLogs/Index', [
            'files' => $files,
            'activeFile' => $activeFile,
            'entries' => $parsed['entries'],
            'counts' => $parsed['counts'],
            'truncated' => $parsed['truncated'],
            'filters' => [
                'file' => $activeFile ?? '',
                'level' => strtoupper($request->string('level')->toString() ?: 'ALL'),
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    public function download(Request $request): BinaryFileResponse
    {
        $filename = $request->string('file')->toString();
        try {
            $path = $this->logService->resolvePath($filename);
        } catch (InvalidArgumentException) {
            abort(404);
        }

        return response()->download($path, basename($path), [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }

    public function clear(Request $request): RedirectResponse
    {
        $filename = $request->string('file')->toString();
        try {
            $this->logService->clearFile($filename);
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        $this->audit->log('system.log_cleared', null, null, null, ['file' => $filename]);

        return back()->with('success', "Log file [{$filename}] cleared.");
    }

    public function destroy(Request $request): RedirectResponse
    {
        $filename = $request->string('file')->toString();
        try {
            $this->logService->deleteFile($filename);
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        $this->audit->log('system.log_deleted', null, null, null, ['file' => $filename]);

        return redirect()->route('admin.system-logs.index')->with('success', "Log file [{$filename}] deleted.");
    }
}
