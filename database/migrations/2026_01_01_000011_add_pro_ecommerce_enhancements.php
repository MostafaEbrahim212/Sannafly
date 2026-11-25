<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'receipt_path')) {
                $table->string('receipt_path')->nullable()->after('idempotency_key');
            }
            if (! Schema::hasColumn('orders', 'tracking_number')) {
                $table->string('tracking_number', 120)->nullable()->index()->after('receipt_path');
            }
            if (! Schema::hasColumn('orders', 'shipping_carrier')) {
                $table->string('shipping_carrier', 80)->nullable()->after('tracking_number');
            }
            if (! Schema::hasColumn('orders', 'total_weight')) {
                $table->decimal('total_weight', 10, 3)->default(0)->after('shipping_carrier');
            }
        });

        Schema::table('coupons', function (Blueprint $table) {
            if (! Schema::hasColumn('coupons', 'first_order_only')) {
                $table->boolean('first_order_only')->default(false)->after('usage_limit_per_customer');
            }
        });

        Schema::table('shipping_zones', function (Blueprint $table) {
            if (! Schema::hasColumn('shipping_zones', 'base_weight_kg')) {
                $table->decimal('base_weight_kg', 10, 3)->default(1)->after('free_shipping_threshold');
            }
            if (! Schema::hasColumn('shipping_zones', 'per_kg_rate')) {
                $table->decimal('per_kg_rate', 15, 4)->default(0)->after('base_weight_kg');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shipping_zones', function (Blueprint $table) {
            $table->dropColumn(['base_weight_kg', 'per_kg_rate']);
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn('first_order_only');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['receipt_path', 'tracking_number', 'shipping_carrier', 'total_weight']);
        });
    }
};
