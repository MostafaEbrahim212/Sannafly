<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::guard('web')->user();
        $filter = $request->string('filter')->toString() ?: 'all';

        $query = $user->notifications()->latest();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif (in_array($filter, ['order', 'payment', 'inventory', 'inquiry'], true)) {
            $query->where('data->category', $filter);
        }

        $notifications = $query->paginate(20)->withQueryString()->through(fn ($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toDateTimeString(),
            'human_time' => $n->created_at?->diffForHumans(),
        ]);

        return Inertia::render('Admin/Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $user->unreadNotifications()->count(),
            'filter' => $filter,
        ]);
    }

    public function feed(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::guard('web')->user();

        $hasNotificationsTable = Schema::hasTable('notifications');
        $unreadCount = $hasNotificationsTable ? $user->unreadNotifications()->count() : 0;
        $latest = $hasNotificationsTable
            ? $user->notifications()->latest()->limit(8)->get()->map(fn ($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'read_at' => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at?->toIso8601String(),
                'human_time' => $n->created_at?->diffForHumans(),
            ])
            : collect();

        $pendingOrders = Order::query()->where('status', 'pending')->count();
        $reviewOrders = Order::query()->whereIn('payment_status', ['needs_review', 'amount_mismatch'])->count();
        $lowStock = Product::query()
            ->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->count();

        $todayOrders = Order::query()->whereDate('created_at', today())->count();
        $todayRevenue = (string) Order::query()
            ->whereDate('created_at', today())
            ->where('payment_status', 'paid')
            ->sum('grand_total');
        $latestOrder = Order::query()->latest('id')->first(['id', 'order_number', 'status', 'payment_status', 'updated_at']);

        return response()->json([
            'unread_count' => $unreadCount,
            'notifications' => $latest,
            'admin_alerts' => [
                'total' => $pendingOrders + $reviewOrders + $lowStock,
                'pending_orders' => $pendingOrders,
                'review_orders' => $reviewOrders,
                'low_stock' => $lowStock,
            ],
            'dashboard_pulse' => [
                'today_orders' => $todayOrders,
                'today_revenue' => $todayRevenue,
                'latest_order_id' => $latestOrder?->id,
                'latest_order_updated_at' => $latestOrder?->updated_at?->toIso8601String(),
            ],
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function markRead(string $id): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::guard('web')->user();
        $user->notifications()->where('id', $id)->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::guard('web')->user();
        $user->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    public function destroy(string $id): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::guard('web')->user();
        $user->notifications()->where('id', $id)->delete();

        return back();
    }

    public function clearRead(): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::guard('web')->user();
        $user->notifications()->whereNotNull('read_at')->delete();

        return back();
    }
}
