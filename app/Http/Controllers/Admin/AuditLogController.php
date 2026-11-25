<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AuditLog::query()->with('user:id,name,email')->latest('created_at');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('actor_name', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('resource_type', 'like', "%{$search}%")
                    ->orWhere('resource_id', 'like', "%{$search}%");
            });
        }

        if ($action = $request->string('action')->trim()->toString()) {
            $query->where('action', $action);
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

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $query->paginate(25)->withQueryString(),
            'actions' => AuditLog::query()->select('action')->distinct()->pluck('action'),
            'resourceTypes' => AuditLog::query()->whereNotNull('resource_type')->select('resource_type')->distinct()->pluck('resource_type'),
            'filters' => (object) $request->only(['search', 'action', 'resource_type', 'from', 'to']),
        ]);
    }
}
