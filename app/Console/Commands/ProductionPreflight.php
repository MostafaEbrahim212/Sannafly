<?php

namespace App\Console\Commands;

use App\Models\PaymentMethod;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProductionPreflight extends Command
{
    protected $signature = 'catalog:preflight';

    protected $description = 'Audit Sannafly configuration, storage, database, and payment gateways before production launch';

    public function handle(): int
    {
        $this->info('Sannafly Production Preflight Check');
        $this->line('--------------------------------------');

        $warnings = 0;

        // 1. APP_KEY & APP_DEBUG
        if (empty(config('app.key'))) {
            $this->error('[FAIL] APP_KEY is missing. Run: php artisan key:generate');
            return self::FAILURE;
        }
        $this->info('[OK] APP_KEY is set.');

        if (config('app.debug')) {
            $this->warn('[WARN] APP_DEBUG is true. Set APP_DEBUG=false in production.');
            $warnings++;
        } else {
            $this->info('[OK] APP_DEBUG is false.');
        }

        // 2. Database connectivity
        try {
            DB::connection()->getPdo();
            $this->info('[OK] Database connection successful ('.config('database.default').').');
        } catch (\Throwable $e) {
            $this->error('[FAIL] Database connection failed: '.$e->getMessage());
            return self::FAILURE;
        }

        // 3. Storage symlink
        if (! is_link(public_path('storage')) && ! is_dir(public_path('storage'))) {
            $this->warn('[WARN] public/storage symlink missing. Run: php artisan storage:link');
            $warnings++;
        } else {
            $this->info('[OK] public/storage link exists.');
        }

        // 4. Mailer check
        $mailer = config('mail.default');
        if (in_array($mailer, ['log', 'array'], true)) {
            $this->warn("[WARN] MAIL_MAILER is '{$mailer}'. Configure SMTP/Resend/Mailgun for real order emails.");
            $warnings++;
        } else {
            $this->info("[OK] Mailer configured: {$mailer}.");
        }

        // 5. Payment Gateways sandbox check
        $sandboxGateways = PaymentMethod::query()
            ->whereIn('driver', ['myfatoorah', 'fawry'])
            ->where('is_active', true)
            ->get()
            ->filter(fn ($pm) => (bool) ($pm->config['sandbox'] ?? true))
            ->pluck('name')
            ->all();

        if (! empty($sandboxGateways)) {
            $this->warn('[WARN] Active payment gateways still in SANDBOX mode: '.implode(', ', $sandboxGateways));
            $warnings++;
        } else {
            $this->info('[OK] No active payment gateways stuck in sandbox mode.');
        }

        // 6. Products without images
        $noImgCount = Product::query()->where('status', 'published')->whereDoesntHave('images')->count();
        if ($noImgCount > 0) {
            $this->warn("[WARN] {$noImgCount} published product(s) have no images. Run: php artisan catalog:generate-images");
            $warnings++;
        } else {
            $this->info('[OK] All published products have images.');
        }

        $this->line('--------------------------------------');
        $this->info("Preflight finished with {$warnings} warning(s).");

        return self::SUCCESS;
    }
}
