<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Policies\UserPolicy;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

it('evaluates ProductPolicy and UserPolicy across all roles and statuses', function () {
    $superAdmin = User::query()->whereHas('roles', fn ($q) => $q->where('slug', 'super-admin'))->firstOrFail();
    $editorRole = Role::query()->where('slug', 'editor')->firstOrFail();
    $viewerRole = Role::query()->where('slug', 'viewer')->firstOrFail();

    $editor = User::factory()->create(['status' => 'active']);
    $editor->roles()->sync([$editorRole->id]);

    $viewer = User::factory()->create(['status' => 'active']);
    $viewer->roles()->sync([$viewerRole->id]);

    $noRole = User::factory()->create(['status' => 'active']);
    $suspended = User::factory()->create(['status' => 'suspended']);
    $suspended->roles()->sync([$editorRole->id]);

    $product = Product::factory()->create();

    expect(Gate::forUser($superAdmin)->allows('delete', $product))->toBeTrue();
    expect(Gate::forUser($editor)->allows('update', $product))->toBeTrue();
    expect(Gate::forUser($editor)->allows('delete', $product))->toBeFalse();
    expect(Gate::forUser($viewer)->allows('viewAny', Product::class))->toBeTrue();
    expect(Gate::forUser($viewer)->allows('create', Product::class))->toBeFalse();
    expect(Gate::forUser($noRole)->allows('viewAny', Product::class))->toBeFalse();
    expect(Gate::forUser($suspended)->allows('update', $product))->toBeFalse();

    $userPolicy = new UserPolicy;
    expect($userPolicy->delete($editor, $editor))->toBeFalse();
    expect($userPolicy->delete($editor, $superAdmin))->toBeFalse();
    expect($userPolicy->delete($superAdmin, $viewer))->toBeTrue();
});

it('enforces CheckPermission any-of semantics and EnsureUserIsActive middleware', function () {
    $user = User::factory()->create(['status' => 'active']);
    $perm = Permission::query()->where('slug', 'products.view')->firstOrFail();
    $user->directPermissions()->sync([$perm->id => ['type' => 'allow']]);

    $middleware = new CheckPermission;
    $request = Request::create('/admin/products', 'GET');
    $request->setUserResolver(fn () => $user);

    $ok = $middleware->handle($request, fn () => new Response('ok'), 'products.edit', 'products.view');
    expect($ok->getStatusCode())->toBe(200);

    expect(fn () => $middleware->handle($request, fn () => new Response('ok'), 'users.delete'))
        ->toThrow(HttpException::class);

    $suspended = User::factory()->create(['status' => 'suspended']);
    $reqSuspended = Request::create('/admin/products', 'GET');
    $reqSuspended->setLaravelSession(app('session.store'));
    $reqSuspended->setUserResolver(fn () => $suspended);
    $activeMw = new EnsureUserIsActive;
    $res = $activeMw->handle($reqSuspended, fn () => new Response('ok'));
    expect($res->getStatusCode())->toBe(302);
});

it('sets locale from session/query in SetLocale and excludes secrets in HandleInertiaRequests', function () {
    $this->get('/locale/ar')->assertRedirect();
    $res = $this->get('/');
    $res->assertOk();
    expect(app()->getLocale())->toBe('ar');

    /** @var HandleInertiaRequests $inertiaMw */
    $inertiaMw = app(HandleInertiaRequests::class);
    $req = Request::create('/', 'GET');
    $req->setLaravelSession(app('session.store'));
    $shared = $inertiaMw->share($req);
    $json = json_encode($shared);
    expect($json)->not->toContain('api_key')->not->toContain('security_key');
});
