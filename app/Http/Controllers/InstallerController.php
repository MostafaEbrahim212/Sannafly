<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\InstallerService;
use App\Services\SettingsService;
use Database\Seeders\DemoCatalogSeeder;
use Database\Seeders\EssentialSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class InstallerController extends Controller
{
    public function __construct(
        private readonly InstallerService $installer,
        private readonly SettingsService $settings,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Installer/Index', [
            'product' => [
                'name' => config('product.name', 'CatalogFlow Commerce'),
                'version' => config('product.version', '2.0.0'),
            ],
            'requirements' => $this->installer->checkRequirements(),
            'defaults' => [
                'app_name' => config('app.name', 'MyStore'),
                'app_url' => request()->getSchemeAndHttpHost(),
                'app_env' => 'production',
                'locale' => 'en',
                'timezone' => 'Africa/Cairo',
                'currency' => 'EGP',
                'db_host' => (string) config('database.connections.mysql.host', '127.0.0.1'),
                'db_port' => (int) config('database.connections.mysql.port', 3306),
                'db_database' => (string) config('database.connections.mysql.database', ''),
                'db_username' => (string) config('database.connections.mysql.username', 'root'),
            ],
        ]);
    }

    public function testDatabase(Request $request): JsonResponse
    {
        $data = $request->validate([
            'db_host' => ['required', 'string', 'max:255'],
            'db_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'db_database' => ['required', 'string', 'max:120'],
            'db_username' => ['required', 'string', 'max:120'],
            'db_password' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $this->installer->testDatabaseConnection(
            $data['db_host'],
            (int) $data['db_port'],
            $data['db_database'],
            $data['db_username'],
            $data['db_password'] ?? ''
        );

        return response()->json($result, $result['ok'] ? 200 : 422);
    }

    public function saveEnvironment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'app_name' => ['required', 'string', 'max:80'],
            'app_url' => ['required', 'url', 'max:255'],
            'app_env' => ['required', 'in:production,local'],
            'locale' => ['required', 'in:en,ar'],
            'timezone' => ['required', 'string', 'max:64'],
            'currency' => ['required', 'string', 'max:10'],
            'db_host' => ['required', 'string', 'max:255'],
            'db_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'db_database' => ['required', 'string', 'max:120'],
            'db_username' => ['required', 'string', 'max:120'],
            'db_password' => ['nullable', 'string', 'max:255'],
        ]);

        // Skip overwriting .env in automated unit tests if requested
        if (! app()->runningUnitTests()) {
            $this->installer->writeEnvSafely([
                'APP_NAME' => $data['app_name'],
                'APP_ENV' => $data['app_env'],
                'APP_DEBUG' => $data['app_env'] === 'local' ? 'true' : 'false',
                'APP_URL' => rtrim($data['app_url'], '/'),
                'APP_LOCALE' => $data['locale'],
                'DB_CONNECTION' => 'mysql',
                'DB_HOST' => $data['db_host'],
                'DB_PORT' => (string) $data['db_port'],
                'DB_DATABASE' => $data['db_database'],
                'DB_USERNAME' => $data['db_username'],
                'DB_PASSWORD' => (string) ($data['db_password'] ?? ''),
            ]);
        }

        return response()->json(['ok' => true, 'message' => 'Environment configuration saved.']);
    }

    public function runInstallation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'app_name' => ['required', 'string', 'max:80'],
            'locale' => ['required', 'in:en,ar'],
            'timezone' => ['required', 'string', 'max:64'],
            'currency' => ['required', 'string', 'max:10'],
            'seed_demo' => ['boolean'],
        ]);

        $steps = [];
        try {
            Artisan::call('migrate', ['--force' => true]);
            $steps[] = 'Database migrations completed.';

            Artisan::call('db:seed', ['--class' => EssentialSeeder::class, '--force' => true]);
            $steps[] = 'Essential system roles, permissions, and settings seeded.';

            $this->settings->set('site_name', $data['app_name'], 'general', 'string', true);
            $this->settings->set('brand_name', $data['app_name'], 'general', 'string', true);
            $this->settings->set('default_locale', $data['locale'], 'localization', 'string', true);
            $this->settings->set('timezone', $data['timezone'], 'localization', 'string', true);
            $this->settings->set('currency', strtoupper($data['currency']), 'general', 'string', true);

            if (! empty($data['seed_demo'])) {
                Artisan::call('db:seed', ['--class' => DemoCatalogSeeder::class, '--force' => true]);
                $steps[] = 'Optional demo catalog data seeded.';
            }

            try {
                Artisan::call('storage:link');
                $steps[] = 'Public storage symlink verified.';
            } catch (Throwable) {
                $steps[] = 'Storage symlink skipped (symlink disabled by host; see Installation Guide).';
            }

            return response()->json(['ok' => true, 'steps' => $steps]);
        } catch (Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Installation step failed: '.$e->getMessage(),
                'steps' => $steps,
            ], 500);
        }
    }

    public function createOwner(Request $request): JsonResponse
    {
        // Double guard: never allow creating an additional owner if one already exists
        $ownerExists = User::query()
            ->whereHas('roles', static fn ($q) => $q->where('slug', 'super-admin'))
            ->exists();

        if ($ownerExists) {
            return response()->json([
                'ok' => false,
                'message' => 'An owner account already exists. Installation is locked.',
            ], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        DB::transaction(function () use ($data): void {
            $owner = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make($data['password']),
            ]);

            $superAdminRole = Role::query()->where('slug', 'super-admin')->firstOrFail();
            $owner->roles()->sync([$superAdminRole->id]);
        });

        $this->installer->markInstalled();

        return response()->json([
            'ok' => true,
            'admin_url' => url('/admin/login'),
            'app_url' => url('/'),
        ]);
    }
}
