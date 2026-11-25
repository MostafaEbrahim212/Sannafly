<?php

use App\Models\Customer;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('ensures every /admin route has explicit permission middleware unless explicitly exempted', function () {
    $exemptNames = [
        'admin.login',
        'admin.login.attempt',
        'admin.logout',
        'admin.password.request',
        'admin.password.email',
        'admin.password.reset',
        'admin.password.update',
        'admin.dashboard',
        'admin.profile',
        'admin.profile.update',
    ];

    $missing = [];
    foreach (Route::getRoutes() as $route) {
        $uri = $route->uri();
        if (! str_starts_with($uri, 'admin/')) {
            continue;
        }
        $name = $route->getName();
        if (in_array($name, $exemptNames, true)) {
            continue;
        }
        $middlewares = $route->gatherMiddleware();
        $hasPerm = collect($middlewares)->contains(fn (string $m) => str_starts_with($m, 'permission:'));
        if (! $hasPerm) {
            $missing[] = "{$uri} ({$name})";
        }
    }

    expect($missing)->toBeEmpty();
});

it('enforces authorization matrix across guest, customer, admin roles, and suspended admin', function (string $method, string $uri, string $requiredPerm) {
    $superAdmin = User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->firstOrFail();
    $customer = Customer::factory()->create();

    $dashPerm = Permission::query()->where('slug', 'dashboard.access')->firstOrFail();
    $noPermRole = Role::query()->create(['name' => 'Empty', 'slug' => 'empty', 'is_system' => false]);
    $noPermRole->permissions()->sync([$dashPerm->id]);
    $adminNoPerm = User::factory()->create(['status' => 'active']);
    $adminNoPerm->roles()->sync([$noPermRole->id]);

    $perm = Permission::query()->where('slug', $requiredPerm)->firstOrFail();
    $withPermRole = Role::query()->create(['name' => 'Scoped', 'slug' => 'scoped-'.uniqid(), 'is_system' => false]);
    $withPermRole->permissions()->sync([$dashPerm->id, $perm->id]);
    $adminWithPerm = User::factory()->create(['status' => 'active']);
    $adminWithPerm->roles()->sync([$withPermRole->id]);

    $suspended = User::factory()->create(['status' => 'suspended']);
    $suspended->roles()->sync([$withPermRole->id]);

    // Guest -> redirect to admin login
    $this->call($method, $uri)->assertRedirect('/admin/login');

    // Customer -> redirected to admin login or denied
    $custRes = $this->actingAs($customer, 'customer')->call($method, $uri);
    expect($custRes->getStatusCode())->toBeIn([302, 401, 403]);

    // Admin without permission -> 403
    $this->actingAs($adminNoPerm, 'web')->call($method, $uri)->assertForbidden();

    // Suspended admin -> redirected to login
    $this->actingAs($suspended, 'web')->call($method, $uri)->assertRedirect('/admin/login');

    // Admin with permission -> 200
    $this->actingAs($adminWithPerm, 'web')->call($method, $uri)->assertOk();

    // Super admin -> 200
    $this->actingAs($superAdmin, 'web')->call($method, $uri)->assertOk();
})->with([
    'products index' => ['GET', '/admin/products', 'products.view'],
    'categories index' => ['GET', '/admin/categories', 'categories.view'],
    'brands index' => ['GET', '/admin/brands', 'brands.manage'],
    'orders index' => ['GET', '/admin/orders', 'orders.view'],
    'users index' => ['GET', '/admin/users', 'users.view'],
    'roles index' => ['GET', '/admin/roles', 'users.manage_roles'],
    'audit logs' => ['GET', '/admin/audit-logs', 'audit_logs.view'],
    'settings' => ['GET', '/admin/settings', 'settings.view'],
    'payment methods' => ['GET', '/admin/payment-methods', 'payments.manage'],
]);
