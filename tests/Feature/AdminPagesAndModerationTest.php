<?php

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
    $this->admin = User::query()->where('email', 'admin@catalogflow.test')->firstOrFail();
});

it('renders about and contact pages and submits general contact inquiry', function () {
    $this->get('/about')->assertOk();
    $this->get('/contact')->assertOk();

    $this->post('/inquiries', [
        'name' => 'Visitor',
        'email' => 'visitor@sannafly.com',
        'message' => 'Hello, I have a question!',
    ])->assertRedirect();

    $this->assertDatabaseHas('product_inquiries', [
        'email' => 'visitor@sannafly.com',
        'product_id' => null,
    ]);
});

it('allows admin to list and suspend/activate customers', function () {
    $customer = Customer::query()->create([
        'name' => 'Ali Buyer',
        'email' => 'ali@sannafly.com',
        'phone' => '01011112222',
        'password' => 'password123',
        'status' => 'active',
    ]);

    $this->actingAs($this->admin)->get('/admin/customers')->assertOk();
    $this->actingAs($this->admin)->put("/admin/customers/{$customer->id}/toggle")->assertRedirect();

    expect($customer->fresh()->status)->toBe('suspended');
});

it('allows admin to moderate and delete product reviews', function () {
    $customer = Customer::query()->create([
        'name' => 'Reviewer',
        'email' => 'rev@sannafly.com',
        'phone' => '01033334444',
        'password' => 'password123',
        'status' => 'active',
    ]);
    $product = Product::query()->create([
        'name' => 'Test Desk',
        'slug' => 'test-desk',
        'sku' => 'DESK-1',
        'status' => 'published',
        'visibility' => 'public',
    ]);
    $review = ProductReview::query()->create([
        'product_id' => $product->id,
        'customer_id' => $customer->id,
        'rating' => 4,
        'title' => 'Nice',
        'is_approved' => true,
    ]);

    $this->actingAs($this->admin)->get('/admin/reviews')->assertOk();
    $this->actingAs($this->admin)->put("/admin/reviews/{$review->id}/toggle")->assertRedirect();
    expect($review->fresh()->is_approved)->toBeFalse();

    $this->actingAs($this->admin)->delete("/admin/reviews/{$review->id}")->assertRedirect();
    expect(ProductReview::query()->find($review->id))->toBeNull();
});

it('allows admin to update policy texts and highlight cards from dashboard', function () {
    $this->actingAs($this->admin)->get('/admin/policies')->assertOk();

    $this->actingAs($this->admin)->post('/admin/policies', [
        'policy_privacy' => 'Updated privacy policy body.',
        'policy_privacy_ar' => 'نص سياسة الخصوصية المحدث.',
        'policy_privacy_highlights' => [
            ['titleEn' => 'Card 1', 'titleAr' => 'بطاقة 1', 'descEn' => 'Desc 1', 'descAr' => 'وصف 1'],
        ],
    ])->assertRedirect();

    $this->get('/policies/privacy-policy')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('bodyEn', 'Updated privacy policy body.')
            ->where('highlights.0.titleAr', 'بطاقة 1')
        );
});
