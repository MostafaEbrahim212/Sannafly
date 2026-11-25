<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('name')->nullable();
            $table->string('type', 20)->default('percent'); // percent | fixed
            $table->decimal('value', 12, 4);
            $table->decimal('min_order_amount', 12, 4)->default(0);
            $table->decimal('max_discount_amount', 12, 4)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shipping_zones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->json('cities')->nullable();
            $table->decimal('rate', 12, 4)->default(0);
            $table->decimal('free_shipping_threshold', 12, 4)->nullable();
            $table->string('estimated_days', 60)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('payment_method_id')->constrained('coupons')->nullOnDelete();
            $table->string('coupon_code', 64)->nullable()->after('coupon_id');
            $table->foreignId('shipping_zone_id')->nullable()->after('coupon_code')->constrained('shipping_zones')->nullOnDelete();
            $table->string('shipping_zone_name')->nullable()->after('shipping_zone_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn('coupon_code');
            $table->dropConstrainedForeignId('shipping_zone_id');
            $table->dropColumn('shipping_zone_name');
        });

        Schema::dropIfExists('shipping_zones');
        Schema::dropIfExists('coupons');
    }
};
