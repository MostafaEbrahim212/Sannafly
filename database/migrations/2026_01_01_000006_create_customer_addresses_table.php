<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('label', 60)->default('Home');
            $table->string('recipient_name');
            $table->string('phone', 30);
            $table->string('country', 80)->default('Egypt');
            $table->string('city', 100);
            $table->string('area', 100)->nullable();
            $table->string('street', 255);
            $table->string('building', 60)->nullable();
            $table->string('floor', 30)->nullable();
            $table->string('apartment', 30)->nullable();
            $table->string('postal_code', 30)->nullable();
            $table->string('notes', 500)->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
    }
};
