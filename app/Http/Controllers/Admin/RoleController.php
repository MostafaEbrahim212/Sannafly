<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Roles/Index', [
            'roles' => Role::query()->with(['permissions:id,slug,name,group'])->withCount('users')->orderBy('id')->get(),
            'permissions' => Permission::query()->orderBy('group')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'description' => ['nullable', 'string', 'max:255'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        DB::transaction(function () use ($data) {
            $role = Role::query()->create([
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'is_system' => false,
            ]);

            $role->permissions()->sync($data['permission_ids'] ?? []);
            $this->audit->log('role.created', 'Role', $role->id, null, $data);
        });

        return back()->with('success', __('Role created successfully.'));
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'permission_ids' => ['array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        DB::transaction(function () use ($role, $data) {
            $oldPerms = $role->permissions()->pluck('permissions.id')->all();

            if (! $role->is_system) {
                $role->update([
                    'name' => $data['name'],
                    'description' => $data['description'] ?? null,
                ]);
            }

            if ($role->slug !== 'super-admin') {
                $role->permissions()->sync($data['permission_ids'] ?? []);
            }

            $this->audit->log('role.updated', 'Role', $role->id, ['permission_ids' => $oldPerms], ['permission_ids' => $data['permission_ids'] ?? []]);
        });

        return back()->with('success', __('Role updated successfully.'));
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            return back()->with('error', __('System roles cannot be deleted.'));
        }

        DB::transaction(function () use ($role) {
            $id = $role->id;
            $role->delete();
            $this->audit->log('role.deleted', 'Role', $id);
        });

        return back()->with('success', __('Role deleted.'));
    }
}
