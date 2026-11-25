<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\ErrorLogger;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    public function showForgotForm(Request $request): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'isAdmin' => $request->routeIs('admin.*'),
            'status' => session('status'),
        ]);
    }

    public function sendResetLink(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $isAdmin = $request->routeIs('admin.*');
        $broker = $isAdmin ? 'users' : 'customers';

        try {
            $status = Password::broker($broker)->sendResetLink(
                $request->only('email'),
                function ($user, string $token) use ($isAdmin) {
                    $url = url($isAdmin ? "/admin/reset-password/{$token}?email=".urlencode($user->email) : "/reset-password/{$token}?email=".urlencode($user->email));
                    $user->notify(new class($url) extends ResetPassword
                    {
                        public function __construct(private readonly string $customUrl)
                        {
                            parent::__construct('');
                        }

                        protected function resetUrl($notifiable): string
                        {
                            return $this->customUrl;
                        }
                    });
                }
            );
        } catch (\Throwable $e) {
            ErrorLogger::warning('auth.password_reset_link_failed', $e, $request);

            return back()->with('status', __('If that email exists in our system, a reset link has been sent.'));
        }

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->with('status', __('If that email exists in our system, a reset link has been sent.'));
    }

    public function showResetForm(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email', ''),
            'isAdmin' => $request->routeIs('admin.*'),
        ]);
    }

    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $isAdmin = $request->routeIs('admin.*');
        $broker = $isAdmin ? 'users' : 'customers';

        $status = Password::broker($broker)->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route($isAdmin ? 'admin.login' : 'login')->with('success', __($status));
        }

        return back()->withErrors(['email' => [__($status)]]);
    }
}
