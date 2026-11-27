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
            ['slug' => 'system.audit_logs.view', 'name' => 'View System Audit Logs', 'group' => 'system'],
            ['slug' => 'system.audit_logs.export', 'name' => 'Export Audit Logs', 'group' => 'system'],
            // System Health, Backups, Updates, License, Support, Demo, Themes
            ['slug' => 'system.health.view', 'name' => 'View System Health', 'group' => 'system'],
            ['slug' => 'system.health.run', 'name' => 'Run System Health Checks', 'group' => 'system'],
            ['slug' => 'system.backups.view', 'name' => 'View System Backups', 'group' => 'system'],
            ['slug' => 'system.backups.create', 'name' => 'Create System Backups', 'group' => 'system'],
            ['slug' => 'system.backups.download', 'name' => 'Download System Backups', 'group' => 'system'],
            ['slug' => 'system.backups.delete', 'name' => 'Delete System Backups', 'group' => 'system'],
            ['slug' => 'system.backups.restore', 'name' => 'Restore System Backups', 'group' => 'system'],
            ['slug' => 'system.updates.view', 'name' => 'View System Updates', 'group' => 'system'],
            ['slug' => 'system.updates.execute', 'name' => 'Execute System Updates', 'group' => 'system'],
            ['slug' => 'system.license.view', 'name' => 'View License Information', 'group' => 'system'],
            ['slug' => 'system.license.manage', 'name' => 'Manage Commercial License', 'group' => 'system'],
            ['slug' => 'system.support.export', 'name' => 'Export Support Diagnostics', 'group' => 'system'],
            ['slug' => 'system.demo.manage', 'name' => 'Manage Demo Mode', 'group' => 'system'],
            ['slug' => 'customizer.themes.view', 'name' => 'View Theme Presets', 'group' => 'settings'],
            ['slug' => 'customizer.themes.manage', 'name' => 'Manage Theme Presets', 'group' => 'settings'],
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

        if (app()->runningUnitTests() && ! request()->is('install*')) {
            $admin = User::query()->firstOrCreate(
                ['email' => 'admin@Sannafly.test'],
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
}
