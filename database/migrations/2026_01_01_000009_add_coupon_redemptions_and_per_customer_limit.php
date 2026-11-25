<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->unsignedInteger('usage_limit_per_customer')->nullable()->after('usage_limit');
        });

        Schema::create('coupon_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_phone', 30)->nullable();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['coupon_id', 'customer_id']);
            $table->index(['coupon_id', 'customer_phone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_redemptions');

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn('usage_limit_per_customer');
        });
    }
};
