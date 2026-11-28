<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;

class GenerateLicenseKeyCommand extends Command
{
    protected $signature = 'license:generate {type=single : License type (single, multi, developer, lifetime, subscription)}';

    protected $description = 'Generate a signed offline commercial license key for a given license type';

    public function handle(): int
    {
        $type = (string) $this->argument('type');
        if (! in_array($type, LicenseService::TYPES, true)) {
            $this->error('Unsupported type. Allowed: '.implode(', ', LicenseService::TYPES));

            return self::FAILURE;
        }

        $key = LicenseService::generateSignedKey($type);
        $this->info("Signed {$type} license key: {$key}");

        return self::SUCCESS;
    }
}
