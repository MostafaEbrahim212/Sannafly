<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('system_backups')) {
            Schema::create('system_backups', function (Blueprint $table): void {
                $table->id();
                $table->string('name')->unique();
                $table->string('type', 32)->default('database'); // database, files, full, settings
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('checksum', 64)->nullable();
                $table->string('integrity_status', 32)->default('verified'); // verified, corrupted, unverified
                $table->string('status', 32)->default('completed'); // completed, failed
                $table->string('product_version', 32)->nullable();
                $table->string('db_version', 64)->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['type', 'created_at']);
            });
        }

        if (! Schema::hasTable('system_updates')) {
            Schema::create('system_updates', function (Blueprint $table): void {
                $table->id();
                $table->string('from_version', 32);
                $table->string('to_version', 32);
                $table->string('status', 32)->default('checked'); // checked, completed, failed, rolled_back
                $table->string('backup_file')->nullable();
                $table->text('notes')->nullable();
                $table->text('error_message')->nullable();
                $table->foreignId('executed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['status', 'created_at']);
            });
        }

        if (! Schema::hasTable('license_activations')) {
            Schema::create('license_activations', function (Blueprint $table): void {
                $table->id();
                $table->string('license_key_masked', 64);
                $table->string('license_type', 32);
                $table->string('domain', 190);
                $table->string('action', 32); // activated, deactivated, revalidated
                $table->string('status', 32); // active, inactive, failed
                $table->text('message')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('created_at')->useCurrent();
                $table->index(['domain', 'created_at']);
            });
        }

        if (! Schema::hasTable('support_exports')) {
            Schema::create('support_exports', function (Blueprint $table): void {
                $table->id();
                $table->string('filename')->unique();
                $table->string('format', 16)->default('json'); // json, txt, zip
                $table->unsignedBigInteger('file_size')->default(0);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        if (! Schema::hasTable('theme_presets')) {
            Schema::create('theme_presets', function (Blueprint $table): void {
                $table->id();
                $table->string('slug', 80)->unique();
                $table->string('name', 120);
                $table->string('name_ar', 120)->nullable();
                $table->string('category', 60)->default('general');
                $table->string('description', 255)->nullable();
                $table->json('config');
                $table->boolean('is_system')->default(false);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('audit_logs')) {
            Schema::table('audit_logs', function (Blueprint $table): void {
                if (! Schema::hasColumn('audit_logs', 'request_id')) {
                    $table->string('request_id', 64)->nullable()->after('user_agent')->index();
                }
                if (! Schema::hasColumn('audit_logs', 'event_type')) {
                    $table->string('event_type', 40)->nullable()->after('action')->index();
                }
                if (! Schema::hasColumn('audit_logs', 'result')) {
                    $table->string('result', 20)->default('success')->after('event_type');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('theme_presets');
        Schema::dropIfExists('support_exports');
        Schema::dropIfExists('license_activations');
        Schema::dropIfExists('system_updates');
        Schema::dropIfExists('system_backups');
    }
};
