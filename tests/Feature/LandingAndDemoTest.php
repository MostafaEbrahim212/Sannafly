<?php

use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\DemoModeService;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders the bilingual product landing page and demo hub', function (): void {
    $this->get('/product')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Landing/Index')
            ->has('demoMode')
        );

    $this->get('/demo')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Demo/Index')
            ->has('demoMode')
        );
});

it('forbids demo reviewer login when demo mode is disabled', function (): void {
    app(DemoModeService::class)->setEnabled(false);

    $this->post('/demo/login-admin')
        ->assertForbidden();
});

it('logs in as restricted demo-reviewer when demo mode is enabled and enforces RBAC', function (): void {
    $this->seed(RbacSeeder::class);
    app(DemoModeService::class)->setEnabled(true);

    $response = $this->post('/demo/login-admin');
    $response->assertRedirect('/admin');

    $this->assertAuthenticated('web');
    $reviewer = auth('web')->user();
    expect($reviewer)->not->toBeNull()
        ->and($reviewer->email)->toBe(DemoModeService::DEMO_EMAIL);

    // Allowed read-only admin views
    $this->actingAs($reviewer, 'web')->get('/admin')->assertOk();
    $this->actingAs($reviewer, 'web')->get('/admin/products')->assertOk();

    // Forbidden sensitive/system views
    $this->actingAs($reviewer, 'web')->get('/admin/system/backups')->assertForbidden();
    $this->actingAs($reviewer, 'web')->get('/admin/system/license')->assertForbidden();
    $this->actingAs($reviewer, 'web')->get('/admin/system/support')->assertForbidden();
    $this->actingAs($reviewer, 'web')->get('/admin/users')->assertForbidden();
    $this->actingAs($reviewer, 'web')->get('/admin/payment-methods')->assertForbidden();
    $this->actingAs($reviewer, 'web')->get('/admin/settings')->assertForbidden();
});

it('blocks sensitive mutations via demo.guard when demo mode is enabled', function (): void {
    $this->seed(RbacSeeder::class);
    $admin = User::factory()->create(['status' => 'active']);
    $superAdminRole = Role::where('slug', 'super-admin')->firstOrFail();
    $admin->roles()->sync([$superAdminRole->id]);

    $product = Product::factory()->create();

    app(DemoModeService::class)->setEnabled(true);

    $this->actingAs($admin, 'web')
        ->post('/admin/settings', ['site_name' => 'Blocked Demo Change'])
        ->assertForbidden();

    $this->actingAs($admin, 'web')
        ->withHeader('X-Inertia', 'true')
        ->delete("/admin/products/{$product->id}")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Product::find($product->id))->not->toBeNull();
});
