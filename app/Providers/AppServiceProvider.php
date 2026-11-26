<?php

namespace App\Providers;

use App\Models\User;
use App\Services\SettingsService;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SettingsService::class);
    }

    public function boot(): void
    {
        Gate::before(function (User $user, string $ability): ?bool {
            if (! $user->isActive()) {
                return false;
            }

            if ($user->isSuperAdmin()) {
                return true;
            }

            return $user->hasPermission($ability) ? true : null;
        });

        if (! $this->app->runningUnitTests()) {
            DB::listen(function (QueryExecuted $query): void {
                if ($query->time >= 500) {
                    Log::channel('slow_queries')->warning('Slow database query', [
                        'time_ms' => round($query->time, 2),
                        'connection' => $query->connectionName,
                        'sql' => $query->sql,
                    ]);
                }
            });
        }
    }
}
