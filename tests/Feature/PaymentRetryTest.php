<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use Illuminate\Support\Facades\Http;

it('allows retrying payment on a failed myfatoorah order and re-reserves stock', function () {
    $customer = Customer::factory()->create();
    $product = Product::factory()->create([
        'track_inventory' => true,
        'stock_quantity' => 5,
    ]);

    $myfatoorah = PaymentMethod::query()->where('driver', 'myfatoorah')->first()
        ?? PaymentMethod::query()->create([
            'code' => 'myfatoorah',
            'name' => 'MyFatoorah',
            'name_ar' => 'ماي فاتورة',
            'driver' => 'myfatoorah',
            'is_active' => true,
            'config' => ['api_key' => 'test-key', 'sandbox' => true, 'country' => 'EGY'],
        ]);

    $myfatoorah->update([
        'is_active' => true,
        'config' => ['api_key' => 'test-key', 'sandbox' => true, 'country' => 'EGY'],
    ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-RETRY-001',
        'customer_id' => $customer->id,
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '01012345678',
        'status' => 'cancelled',
        'payment_status' => 'failed',
        'payment_method_id' => $myfatoorah->id,
        'subtotal' => '200.0000',
        'discount_total' => '0.0000',
        'shipping_total' => '0.0000',
        'tax_total' => '0.0000',
        'grand_total' => '200.0000',
        'currency' => 'EGP',
    ]);

    OrderItem::query()->create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'quantity' => 2,
        'unit_price' => '100.0000',
        'total_price' => '200.0000',
    ]);

    Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $myfatoorah->id,
        'amount' => '200.0000',
        'currency' => 'EGP',
        'status' => 'failed',
        'transaction_reference' => '111222',
    ]);

    Http::fake([
        'https://apitest.myfatoorah.com/v2/SendPayment' => Http::response([
            'IsSuccess' => true,
            'Data' => [
                'InvoiceId' => 999888,
                'InvoiceURL' => 'https://demo.myfatoorah.com/pay/retry-999888',
            ],
        ]),
    ]);

    $response = $this->actingAs($customer, 'customer')
        ->post("/orders/{$order->order_number}/retry-payment");

    $response->assertRedirect('https://demo.myfatoorah.com/pay/retry-999888');

    $order->refresh();
    $product->refresh();

    expect($order->status)->toBe('pending')
        ->and($order->payment_status)->toBe('unpaid')
        ->and($product->stock_quantity)->toBe(3)
        ->and($order->payments()->count())->toBe(2)
        ->and($order->payments()->latest('id')->first()?->transaction_reference)->toBe('999888');
});

it('forbids retrying payment for another customer order', function () {
    $owner = Customer::factory()->create();
    $other = Customer::factory()->create();

    $myfatoorah = PaymentMethod::query()->where('driver', 'myfatoorah')->first()
        ?? PaymentMethod::query()->create([
            'code' => 'myfatoorah',
            'name' => 'MyFatoorah',
            'name_ar' => 'ماي فاتورة',
            'driver' => 'myfatoorah',
            'is_active' => true,
            'config' => ['api_key' => 'test-key', 'sandbox' => true, 'country' => 'EGY'],
        ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-RETRY-002',
        'customer_id' => $owner->id,
        'customer_name' => $owner->name,
        'customer_email' => $owner->email,
        'customer_phone' => '01012345678',
        'status' => 'pending',
        'payment_status' => 'unpaid',
        'payment_method_id' => $myfatoorah->id,
        'subtotal' => '100.0000',
        'discount_total' => '0.0000',
        'shipping_total' => '0.0000',
        'tax_total' => '0.0000',
        'grand_total' => '100.0000',
        'currency' => 'EGP',
    ]);

    $this->actingAs($other, 'customer')
        ->post("/orders/{$order->order_number}/retry-payment")
        ->assertForbidden();
});

it('allows switching payment method from failed fawry order to cod or myfatoorah', function () {
    $customer = Customer::factory()->create();

    $fawry = PaymentMethod::query()->where('driver', 'fawry')->first()
        ?? PaymentMethod::query()->create([
            'code' => 'fawry',
            'name' => 'Fawry',
            'name_ar' => 'فوري',
            'driver' => 'fawry',
            'is_active' => true,
            'config' => ['sandbox' => true],
        ]);

    $cod = PaymentMethod::query()->where('driver', 'cod')->first()
        ?? PaymentMethod::query()->create([
            'code' => 'cod',
            'name' => 'Cash on Delivery',
            'name_ar' => 'الدفع عند الاستلام',
            'driver' => 'cod',
            'is_active' => true,
            'config' => [],
        ]);
    $cod->update(['is_active' => true]);

    $order = Order::query()->create([
        'order_number' => 'ORD-SWITCH-001',
        'customer_id' => $customer->id,
        'customer_name' => $customer->name,
        'customer_email' => $customer->email,
        'customer_phone' => '01012345678',
        'status' => 'cancelled',
        'payment_status' => 'failed',
        'payment_method_id' => $fawry->id,
        'subtotal' => '150.0000',
        'discount_total' => '0.0000',
        'shipping_total' => '20.0000',
        'tax_total' => '0.0000',
        'grand_total' => '170.0000',
        'currency' => 'EGP',
    ]);

    $this->actingAs($customer, 'customer')
        ->post("/orders/{$order->order_number}/retry-payment", [
            'payment_method_id' => $cod->id,
        ])
        ->assertRedirect();

    $order->refresh();
    expect($order->payment_method_id)->toBe($cod->id)
        ->and($order->status)->toBe('pending')
        ->and($order->payment_status)->toBe('unpaid');
});
