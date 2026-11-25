<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'avatar',
        'status',
        'password',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_role');
    }

    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permission')
            ->withPivot('type');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuperAdmin(): bool
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles->contains('slug', 'super-admin');
        }

        return $this->roles()->where('slug', 'super-admin')->exists();
    }

    public function hasRole(string $roleSlug): bool
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles->contains('slug', $roleSlug);
        }

        return $this->roles()->where('slug', $roleSlug)->exists();
    }

    /**
     * Resolve effective permission slugs: role permissions + direct allow - direct deny.
     *
     * @return array<int, string>
     */
    public function getAllPermissionSlugs(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::query()->pluck('slug')->all();
        }

        $rolePerms = Permission::query()
            ->whereHas('roles.users', fn ($q) => $q->where('users.id', $this->id))
            ->pluck('slug')
            ->all();

        $direct = $this->directPermissions()->get();
        $allowed = $direct->where('pivot.type', 'allow')->pluck('slug')->all();
        $denied = $direct->where('pivot.type', 'deny')->pluck('slug')->all();

        return array_values(array_diff(array_unique(array_merge($rolePerms, $allowed)), $denied));
    }

    public function hasPermission(string $permissionSlug): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($permissionSlug, $this->getAllPermissionSlugs(), true);
    }
}
