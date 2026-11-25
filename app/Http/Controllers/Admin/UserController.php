<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): Response
    {
        $query = User::query()->with(['roles:id,name,slug'])->withTrashed();

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->trim()->toString()) {
            if ($status === 'deleted') {
                $query->onlyTrashed();
            } else {
                $query->whereNull('deleted_at')->where('status', $status);
            }
        }

        if ($role = $request->string('role')->trim()->toString()) {
            $query->whereHas('roles', fn ($q) => $q->where('slug', $role));
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => Role::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'permissions' => Permission::query()->orderBy('group')->orderBy('name')->get(['id', 'name', 'slug', 'group']),
            'filters' => (object) $request->only(['search', 'status', 'role']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['required', Password::min(8)->mixedCase()->numbers()],
            'role_ids' => ['array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => $data['status'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);

            if (! empty($data['role_ids'])) {
                $user->roles()->sync($data['role_ids']);
            }

            $this->audit->log('user.created', 'User', $user->id, null, [
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'role_ids' => $data['role_ids'] ?? [],
            ]);

            return $user;
        });

        return back()->with('success', __('User created successfully.'));
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['nullable', Password::min(8)->mixedCase()->numbers()],
            'role_ids' => ['array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
            'direct_permissions' => ['array'],
            'direct_permissions.*.id' => ['integer', 'exists:permissions,id'],
            'direct_permissions.*.type' => [Rule::in(['allow', 'deny'])],
        ]);

        DB::transaction(function () use ($user, $data) {
            $old = $user->only(['name', 'email', 'phone', 'status']);

            $updateData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => $data['status'],
            ];

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            if (array_key_exists('role_ids', $data)) {
                $user->roles()->sync($data['role_ids'] ?? []);
            }

            if (array_key_exists('direct_permissions', $data)) {
                $sync = [];
                foreach ($data['direct_permissions'] ?? [] as $perm) {
                    $sync[$perm['id']] = ['type' => $perm['type']];
                }
                $user->directPermissions()->sync($sync);
            }

            $this->audit->log('user.updated', 'User', $user->id, $old, $user->only(['name', 'email', 'phone', 'status']));
        });

        return back()->with('success', __('User updated successfully.'));
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            return back()->with('error', __('You cannot delete your own account.'));
        }

        if ($user->isSuperAdmin() && ! $request->user()->isSuperAdmin()) {
            abort(403);
        }

        DB::transaction(function () use ($user) {
            $user->update(['status' => 'inactive']);
            $user->delete();
            $this->audit->log('user.deleted', 'User', $user->id);
        });

        return back()->with('success', __('User deactivated and archived.'));
    }

    public function restore(int $id): RedirectResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        DB::transaction(function () use ($user) {
            $user->restore();
            $user->update(['status' => 'active']);
            $this->audit->log('user.restored', 'User', $user->id);
        });

        return back()->with('success', __('User restored successfully.'));
    }

    public function export(): StreamedResponse
    {
        $this->audit->log('user.exported', 'User');

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Email', 'Phone', 'Status', 'Roles', 'Last Login']);

            User::query()->with('roles:id,name')->chunk(200, function ($users) use ($handle) {
                foreach ($users as $user) {
                    fputcsv($handle, [
                        $user->id,
                        $this->csvSafe($user->name),
                        $this->csvSafe($user->email),
                        $this->csvSafe((string) $user->phone),
                        $user->status,
                        $user->roles->pluck('name')->implode(', '),
                        $user->last_login_at?->toDateTimeString() ?? '',
                    ]);
                }
            });

            fclose($handle);
        }, 'users-export-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function csvSafe(string $value): string
    {
        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
