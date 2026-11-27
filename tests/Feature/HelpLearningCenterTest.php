<?php

use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('protects /admin/help behind admin authentication and dashboard.access', function (): void {
    $this->get('/admin/help')->assertRedirect('/admin/login');

    $customer = Customer::factory()->create();
    $this->actingAs($customer, 'customer')
        ->get('/admin/help')
        ->assertForbidden();
});

it('renders the interactive Learning Center at /admin/help for authorized staff', function (): void {
    $this->seed(RbacSeeder::class);
    $admin = User::factory()->create(['status' => 'active']);
    $role = Role::where('slug', 'super-admin')->firstOrFail();
    $admin->roles()->sync([$role->id]);

    $this->actingAs($admin, 'web')
        ->get('/admin/help')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Help/Index'));
});
