<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Products
            ['slug' => 'products.view', 'name' => 'View Products', 'group' => 'products'],
            ['slug' => 'products.create', 'name' => 'Create Products', 'group' => 'products'],
            ['slug' => 'products.edit', 'name' => 'Edit Products', 'group' => 'products'],
            ['slug' => 'products.delete', 'name' => 'Delete Products', 'group' => 'products'],
            ['slug' => 'products.publish', 'name' => 'Publish Products', 'group' => 'products'],
            ['slug' => 'products.export', 'name' => 'Export Products', 'group' => 'products'],
            ['slug' => 'products.import', 'name' => 'Import Products', 'group' => 'products'],
            ['slug' => 'products.print', 'name' => 'Print Products', 'group' => 'products'],
            // Categories & Brands
            ['slug' => 'categories.view', 'name' => 'View Categories', 'group' => 'catalog'],
            ['slug' => 'categories.manage', 'name' => 'Manage Categories', 'group' => 'catalog'],
            ['slug' => 'brands.manage', 'name' => 'Manage Brands', 'group' => 'catalog'],
            // Inventory
            ['slug' => 'inventory.view', 'name' => 'View Inventory', 'group' => 'inventory'],
            ['slug' => 'inventory.manage', 'name' => 'Manage Inventory', 'group' => 'inventory'],
            // Users & Roles
            ['slug' => 'users.view', 'name' => 'View Users', 'group' => 'users'],
            ['slug' => 'users.create', 'name' => 'Create Users', 'group' => 'users'],
            ['slug' => 'users.edit', 'name' => 'Edit Users', 'group' => 'users'],
            ['slug' => 'users.delete', 'name' => 'Delete Users', 'group' => 'users'],
            ['slug' => 'users.manage_roles', 'name' => 'Manage User Roles & Permissions', 'group' => 'users'],
            // Settings & Payments
            ['slug' => 'settings.view', 'name' => 'View Settings', 'group' => 'settings'],
            ['slug' => 'settings.manage', 'name' => 'Manage Settings', 'group' => 'settings'],
            ['slug' => 'payments.manage', 'name' => 'Manage Payment Methods', 'group' => 'payments'],
            // Orders & Inquiries
            ['slug' => 'orders.view', 'name' => 'View Orders', 'group' => 'orders'],
            ['slug' => 'orders.manage', 'name' => 'Manage Orders', 'group' => 'orders'],
            ['slug' => 'inquiries.manage', 'name' => 'Manage Inquiries', 'group' => 'orders'],
            // Reports & Audit
            ['slug' => 'reports.view', 'name' => 'View Reports', 'group' => 'reports'],
            ['slug' => 'audit_logs.view', 'name' => 'View Audit Logs', 'group' => 'security'],
            // Dashboard access
            ['slug' => 'dashboard.access', 'name' => 'Access Admin Dashboard', 'group' => 'dashboard'],
        ];

        $permModels = [];
        foreach ($permissions as $perm) {
            $permModels[$perm['slug']] = Permission::query()->updateOrCreate(
                ['slug' => $perm['slug']],
                $perm
            );
        }

        $roles = [
            'super-admin' => ['name' => 'Super Admin', 'is_system' => true, 'perms' => array_keys($permModels)],
            'admin' => ['name' => 'Admin', 'is_system' => true, 'perms' => array_keys($permModels)],
            'manager' => [
                'name' => 'Manager',
                'is_system' => true,
                'perms' => [
                    'dashboard.access', 'products.view', 'products.create', 'products.edit', 'products.publish',
                    'products.export', 'products.print', 'categories.view', 'categories.manage', 'brands.manage',
                    'inventory.view', 'inventory.manage', 'orders.view', 'orders.manage', 'inquiries.manage',
                    'reports.view', 'users.view',
                ],
            ],
            'product-manager' => [
                'name' => 'Product Manager',
                'is_system' => true,
                'perms' => [
                    'dashboard.access', 'products.view', 'products.create', 'products.edit', 'products.delete',
                    'products.publish', 'products.export', 'products.import', 'products.print',
                    'categories.view', 'categories.manage', 'brands.manage', 'inventory.view',
                ],
            ],
            'inventory-manager' => [
                'name' => 'Inventory Manager',
                'is_system' => true,
                'perms' => ['dashboard.access', 'products.view', 'products.print', 'inventory.view', 'inventory.manage'],
            ],
            'editor' => [
                'name' => 'Editor',
                'is_system' => true,
                'perms' => ['dashboard.access', 'products.view', 'products.create', 'products.edit', 'categories.view'],
            ],
            'viewer' => [
                'name' => 'Viewer',
                'is_system' => true,
                'perms' => ['dashboard.access', 'products.view', 'categories.view', 'inventory.view', 'orders.view'],
            ],
            'customer' => [
                'name' => 'Customer',
                'is_system' => true,
                'perms' => [],
            ],
        ];

        foreach ($roles as $slug => $data) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $data['name'], 'is_system' => $data['is_system']]
            );
            $role->permissions()->sync(
                collect($data['perms'])->map(fn ($s) => $permModels[$s]->id)->all()
            );
        }

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@catalogflow.test'],
            [
                'name' => 'Super Administrator',
                'phone' => '+10000000000',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make('Password123!'),
            ]
        );

        $superAdminRole = Role::query()->where('slug', 'super-admin')->first();
        if ($superAdminRole) {
            $admin->roles()->syncWithoutDetaching([$superAdminRole->id]);
        }
    }
}
