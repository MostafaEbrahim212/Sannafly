<?php

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders themed Inertia ErrorPage for 404 and 403 while preserving HTTP status codes', function (): void {
    $this->get('/non-existent-page-xyz-123')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page
            ->component('Errors/ErrorPage')
            ->where('status', 404)
        );

    $customer = Customer::factory()->create();
    $this->actingAs($customer, 'customer')
        ->get('/admin/system/health')
        ->assertForbidden()
        ->assertInertia(fn ($page) => $page
            ->component('Errors/ErrorPage')
            ->where('status', 403)
        );
});

it('returns JSON instead of Inertia ErrorPage for JSON API requests', function (): void {
    $this->getJson('/non-existent-api-endpoint')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});
