<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $this->filteredQuery($request);

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $query->paginate(25)->withQueryString(),
            'actions' => AuditLog::query()->select('action')->distinct()->pluck('action'),
            'eventTypes' => AuditLog::query()->whereNotNull('event_type')->select('event_type')->distinct()->pluck('event_type'),
            'resourceTypes' => AuditLog::query()->whereNotNull('resource_type')->select('resource_type')->distinct()->pluck('resource_type'),
            'filters' => (object) $request->only(['search', 'action', 'event_type', 'resource_type', 'from', 'to']),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->filteredQuery($request)->limit(2000)->get();

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'wb');
            if ($out === false) {
                return;
            }
            fputcsv($out, ['ID', 'Timestamp', 'Actor', 'Action', 'Event Type', 'Result', 'Subject Type', 'Subject ID', 'IP', 'Request ID']);
            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->id,
                    $row->created_at?->toIso8601String(),
                    $this->safeCsv((string) $row->actor_name),
                    $this->safeCsv((string) $row->action),
                    $this->safeCsv((string) ($row->event_type ?? '')),
                    $this->safeCsv((string) ($row->result ?? 'success')),
                    $this->safeCsv((string) ($row->resource_type ?? '')),
                    $this->safeCsv((string) ($row->resource_id ?? '')),
                    $this->safeCsv((string) ($row->ip_address ?? '')),
                    $this->safeCsv((string) ($row->request_id ?? '')),
                ]);
            }
            fclose($out);
        }, 'audit-logs-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    private function filteredQuery(Request $request)
    {
        $query = AuditLog::query()->with('user:id,name,email')->latest('created_at');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('actor_name', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('resource_type', 'like', "%{$search}%")
                    ->orWhere('resource_id', 'like', "%{$search}%")
                    ->orWhere('request_id', 'like', "%{$search}%");
            });
        }

        if ($action = $request->string('action')->trim()->toString()) {
            $query->where('action', $action);
        }

        if ($eventType = $request->string('event_type')->trim()->toString()) {
            $query->where('event_type', $eventType);
        }

        if ($resourceType = $request->string('resource_type')->trim()->toString()) {
            $query->where('resource_type', $resourceType);
        }

        if ($from = $request->string('from')->trim()->toString()) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->string('to')->trim()->toString()) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query;
    }

    private function safeCsv(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
