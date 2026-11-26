<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AttributeController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ImportExportController;
use App\Http\Controllers\Admin\InquiryController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\PolicyController;
use App\Http\Controllers\Admin\PrintController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\ShippingZoneController;
use App\Http\Controllers\Admin\SystemLogController;
use App\Http\Controllers\Admin\SystemToolsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\CustomerAuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\CartCheckoutController;
use App\Http\Controllers\CustomerNotificationController;
use App\Http\Controllers\CustomerProfileController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

// Public Storefront
Route::get('/', [StorefrontController::class, 'home'])->name('home');
Route::get('/catalog', [StorefrontController::class, 'catalog'])->name('catalog');
Route::get('/products/{slug}', [StorefrontController::class, 'show'])->name('products.show');
Route::post('/inquiries', [StorefrontController::class, 'submitInquiry'])->middleware('throttle:10,1')->name('inquiries.store');
Route::get('/locale/{locale}', [StorefrontController::class, 'switchLocale'])->name('locale.switch');
Route::get('/about', [StorefrontController::class, 'about'])->name('about');
Route::get('/contact', [StorefrontController::class, 'contact'])->name('contact');
Route::get('/policies/{slug}', [StorefrontController::class, 'policy'])->name('policies.show');
Route::get('/sitemap.xml', [StorefrontController::class, 'sitemap'])->name('sitemap');

// Optional E-Commerce Storefront
Route::get('/cart', [CartCheckoutController::class, 'cart'])->name('cart');
Route::post('/cart/add', [CartCheckoutController::class, 'addToCart'])->middleware('throttle:30,1')->name('cart.add');
Route::put('/cart/{key}', [CartCheckoutController::class, 'updateCartQuantity'])->name('cart.update');
Route::delete('/cart/{key}', [CartCheckoutController::class, 'removeFromCart'])->name('cart.remove');
Route::post('/cart/coupon', [CartCheckoutController::class, 'applyCoupon'])->middleware('throttle:10,1')->name('cart.coupon.apply');
Route::delete('/cart/coupon', [CartCheckoutController::class, 'removeCoupon'])->name('cart.coupon.remove');
Route::post('/checkout', [CartCheckoutController::class, 'checkout'])->middleware('throttle:10,1')->name('checkout');
Route::get('/payments/return/{driver}', [CartCheckoutController::class, 'paymentReturn'])->name('payments.return');
Route::post('/payments/callback/{driver}', [CartCheckoutController::class, 'paymentCallback'])->name('payments.callback');
Route::get('/orders/confirmation/{orderNumber}', [CartCheckoutController::class, 'confirmation'])->name('orders.confirmation');
Route::post('/orders/{orderNumber}/retry-payment', [CartCheckoutController::class, 'retryPayment'])->middleware('throttle:10,1')->name('orders.retry-payment');
Route::get('/track-order', [CartCheckoutController::class, 'trackOrder'])->name('orders.track');
Route::get('/orders/{orderNumber}/live-status', [CustomerNotificationController::class, 'orderLiveStatus'])->name('orders.live-status');

// Storefront Customer Authentication
Route::middleware('guest:customer')->group(function () {
    Route::get('/login', [CustomerAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [CustomerAuthController::class, 'login'])->middleware('throttle:10,1')->name('login.attempt');
    Route::get('/register', [CustomerAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [CustomerAuthController::class, 'register'])->name('register.attempt');
    Route::get('/forgot-password', [PasswordResetController::class, 'showForgotForm'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->middleware('throttle:5,1')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->name('password.update');
});
Route::post('/logout', [CustomerAuthController::class, 'logout'])->middleware('auth:customer')->name('logout');
Route::middleware('auth:customer')->group(function () {
    Route::get('/my-orders', [CustomerAuthController::class, 'myOrders'])->name('customer.orders');
    Route::post('/my-orders/{order}/cancel', [CustomerAuthController::class, 'cancelOrder'])->name('customer.orders.cancel');
    Route::get('/profile', [CustomerProfileController::class, 'show'])->name('customer.profile');
    Route::put('/profile', [CustomerProfileController::class, 'updateProfile'])->name('customer.profile.update');
    Route::put('/profile/password', [CustomerProfileController::class, 'updatePassword'])->name('customer.profile.password');
    Route::post('/profile/addresses', [CustomerProfileController::class, 'storeAddress'])->name('customer.addresses.store');
    Route::put('/profile/addresses/{address}', [CustomerProfileController::class, 'updateAddress'])->name('customer.addresses.update');
    Route::post('/profile/addresses/{address}/default', [CustomerProfileController::class, 'setDefaultAddress'])->name('customer.addresses.default');
    Route::delete('/profile/addresses/{address}', [CustomerProfileController::class, 'destroyAddress'])->name('customer.addresses.destroy');
    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::post('/products/{product}/reviews', [ProductReviewController::class, 'store'])->middleware('throttle:10,1')->name('products.reviews.store');

    // Customer Notifications & Realtime Feed
    Route::get('/account/notifications', [CustomerNotificationController::class, 'index'])->name('customer.notifications.index');
    Route::get('/account/realtime/feed', [CustomerNotificationController::class, 'feed'])->name('customer.realtime.feed');
    Route::post('/account/notifications/{id}/read', [CustomerNotificationController::class, 'markRead'])->name('customer.notifications.read');
    Route::post('/account/notifications/read-all', [CustomerNotificationController::class, 'markAllRead'])->name('customer.notifications.read-all');
    Route::delete('/account/notifications/{id}', [CustomerNotificationController::class, 'destroy'])->name('customer.notifications.destroy');
});

// Admin Authentication (completely separated from Customer)
Route::prefix('admin')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->middleware('guest:web')->name('admin.login');
    Route::post('/login', [AuthController::class, 'login'])->middleware(['guest:web', 'throttle:10,1'])->name('admin.login.attempt');
    Route::get('/forgot-password', [PasswordResetController::class, 'showForgotForm'])->middleware('guest:web')->name('admin.password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->middleware(['guest:web', 'throttle:5,1'])->name('admin.password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'showResetForm'])->middleware('guest:web')->name('admin.password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('guest:web')->name('admin.password.update');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:web')->name('admin.logout');
});

// Secure Admin Dashboard
Route::prefix('admin')->name('admin.')->middleware(['auth', 'active', 'permission:dashboard.access'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Admin Notifications & Realtime Feed
    Route::get('/notifications', [AdminNotificationController::class, 'index'])->name('notifications.index');
    Route::get('/realtime/feed', [AdminNotificationController::class, 'feed'])->name('realtime.feed');
    Route::post('/notifications/{id}/read', [AdminNotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [AdminNotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('/notifications/{id}', [AdminNotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('/notifications', [AdminNotificationController::class, 'clearRead'])->name('notifications.clear-read');
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Products
    Route::middleware('permission:products.view')->group(function () {
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    });
    Route::get('/products/create', [ProductController::class, 'create'])->middleware('permission:products.create')->name('products.create');
    Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products.create')->name('products.store');
    Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->middleware('permission:products.edit')->name('products.edit');
    Route::match(['put', 'post'], '/products/{product}', [ProductController::class, 'update'])->middleware('permission:products.edit')->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete')->name('products.destroy');
    Route::post('/products/bulk', [ProductController::class, 'bulkAction'])->middleware('permission:products.edit')->name('products.bulk');
    Route::post('/products/{product}/variations/generate', [ProductController::class, 'generateVariations'])->middleware('permission:products.edit')->name('products.variations.generate');
    Route::post('/products/{product}/images/reorder', [ProductController::class, 'reorderImages'])->middleware('permission:products.edit')->name('products.images.reorder');
    Route::post('/products/{product}/images/{image}/main', [ProductController::class, 'setMainImage'])->middleware('permission:products.edit')->name('products.images.main');
    Route::delete('/products/{product}/images/{image}', [ProductController::class, 'deleteImage'])->middleware('permission:products.edit')->name('products.images.destroy');

    // Categories, Brands, Attributes
    Route::get('/categories', [CategoryController::class, 'index'])->middleware('permission:categories.view')->name('categories.index');
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:categories.manage')->name('categories.store');
    Route::match(['put', 'post'], '/categories/{category}', [CategoryController::class, 'update'])->middleware('permission:categories.manage')->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:categories.manage')->name('categories.destroy');

    Route::get('/brands', [BrandController::class, 'index'])->middleware('permission:brands.manage')->name('brands.index');
    Route::post('/brands', [BrandController::class, 'store'])->middleware('permission:brands.manage')->name('brands.store');
    Route::match(['put', 'post'], '/brands/{brand}', [BrandController::class, 'update'])->middleware('permission:brands.manage')->name('brands.update');
    Route::delete('/brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:brands.manage')->name('brands.destroy');

    Route::get('/attributes', [AttributeController::class, 'index'])->middleware('permission:products.edit')->name('attributes.index');
    Route::post('/attributes', [AttributeController::class, 'store'])->middleware('permission:products.edit')->name('attributes.store');
    Route::post('/attributes/quick', [AttributeController::class, 'quickStore'])->middleware('permission:products.edit')->name('attributes.quick');
    Route::post('/attributes/{attribute}/options', [AttributeController::class, 'storeOption'])->middleware('permission:products.edit')->name('attributes.options.store');
    Route::delete('/attribute-options/{option}', [AttributeController::class, 'destroyOption'])->middleware('permission:products.edit')->name('attributes.options.destroy');

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->middleware('permission:inventory.view')->name('inventory.index');
    Route::post('/inventory/{product}/adjust', [InventoryController::class, 'adjust'])->middleware('permission:inventory.manage')->name('inventory.adjust');

    // Import & Export
    Route::get('/import-export', [ImportExportController::class, 'index'])->middleware('permission:products.import,products.export')->name('import-export.index');
    Route::get('/import-export/template/{format?}', [ImportExportController::class, 'downloadTemplate'])->middleware('permission:products.import')->name('import-export.template');
    Route::get('/import-export/export', [ImportExportController::class, 'export'])->middleware('permission:products.export')->name('import-export.export');
    Route::post('/import-export/preview', [ImportExportController::class, 'preview'])->middleware('permission:products.import')->name('import-export.preview');
    Route::post('/import-export/import', [ImportExportController::class, 'import'])->middleware('permission:products.import')->name('import-export.import');
    Route::get('/import-export/jobs/{job}/errors', [ImportExportController::class, 'downloadErrors'])->middleware('permission:products.import')->name('import-export.errors');

    // Printing
    Route::get('/print/catalog', [PrintController::class, 'catalog'])->middleware('permission:products.print')->name('print.catalog');
    Route::get('/print/products/{product}', [PrintController::class, 'product'])->middleware('permission:products.print')->name('print.product');

    // Users & Roles
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.view')->name('users.index');
    Route::get('/users/export', [UserController::class, 'export'])->middleware('permission:users.view')->name('users.export');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create')->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.edit')->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete')->name('users.destroy');
    Route::post('/users/{id}/restore', [UserController::class, 'restore'])->middleware('permission:users.edit')->name('users.restore');

    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:users.manage_roles')->name('roles.index');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:users.manage_roles')->name('roles.store');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:users.manage_roles')->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:users.manage_roles')->name('roles.destroy');

    // Audit Logs
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit_logs.view')->name('audit-logs.index');

    // System Logs & Developer/Ops Tools
    Route::get('/system-logs', [SystemLogController::class, 'index'])->middleware('permission:audit_logs.view')->name('system-logs.index');
    Route::get('/system-logs/download', [SystemLogController::class, 'download'])->middleware('permission:audit_logs.view')->name('system-logs.download');
    Route::post('/system-logs/clear', [SystemLogController::class, 'clear'])->middleware('permission:settings.manage')->name('system-logs.clear');
    Route::delete('/system-logs', [SystemLogController::class, 'destroy'])->middleware('permission:settings.manage')->name('system-logs.destroy');

    Route::get('/system-tools', [SystemToolsController::class, 'index'])->middleware('permission:settings.manage')->name('system-tools.index');
    Route::post('/system-tools/action', [SystemToolsController::class, 'runAction'])->middleware('permission:settings.manage')->name('system-tools.action');
    Route::post('/system-tools/backup', [SystemToolsController::class, 'createBackup'])->middleware('permission:settings.manage')->name('system-tools.backup.create');
    Route::get('/system-tools/backup/download', [SystemToolsController::class, 'downloadBackup'])->middleware('permission:settings.manage')->name('system-tools.backup.download');
    Route::delete('/system-tools/backup', [SystemToolsController::class, 'deleteBackup'])->middleware('permission:settings.manage')->name('system-tools.backup.delete');

    // Settings, Customizer, Payment Methods
    Route::get('/settings', [SettingsController::class, 'index'])->middleware('permission:settings.view')->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->middleware('permission:settings.manage')->name('settings.update');
    Route::get('/customizer', [SettingsController::class, 'customizer'])->middleware('permission:settings.manage')->name('customizer.index');

    Route::get('/payment-methods', [PaymentMethodController::class, 'index'])->middleware('permission:payments.manage')->name('payment-methods.index');
    Route::put('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])->middleware('permission:payments.manage')->name('payment-methods.update');

    // Coupons & Shipping Zones
    Route::get('/coupons', [CouponController::class, 'index'])->middleware('permission:orders.manage')->name('coupons.index');
    Route::post('/coupons', [CouponController::class, 'store'])->middleware('permission:orders.manage')->name('coupons.store');
    Route::put('/coupons/{coupon}', [CouponController::class, 'update'])->middleware('permission:orders.manage')->name('coupons.update');
    Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy'])->middleware('permission:orders.manage')->name('coupons.destroy');

    Route::get('/shipping-zones', [ShippingZoneController::class, 'index'])->middleware('permission:settings.manage')->name('shipping-zones.index');
    Route::post('/shipping-zones', [ShippingZoneController::class, 'store'])->middleware('permission:settings.manage')->name('shipping-zones.store');
    Route::put('/shipping-zones/{shippingZone}', [ShippingZoneController::class, 'update'])->middleware('permission:settings.manage')->name('shipping-zones.update');
    Route::delete('/shipping-zones/{shippingZone}', [ShippingZoneController::class, 'destroy'])->middleware('permission:settings.manage')->name('shipping-zones.destroy');

    // Orders & Inquiries
    Route::get('/orders', [OrderController::class, 'index'])->middleware('permission:orders.view')->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->middleware('permission:orders.view')->name('orders.show');
    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice'])->middleware('permission:orders.view')->name('orders.invoice');
    Route::get('/orders/{order}/label', [OrderController::class, 'shippingLabel'])->middleware('permission:orders.view')->name('orders.label');
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus'])->middleware('permission:orders.manage')->name('orders.status');

    Route::get('/analytics', [AnalyticsController::class, 'index'])->middleware('permission:orders.view')->name('analytics.index');
    Route::get('/analytics/export', [AnalyticsController::class, 'export'])->middleware('permission:orders.view')->name('analytics.export');
    Route::get('/inquiries', [InquiryController::class, 'index'])->middleware('permission:inquiries.manage')->name('inquiries.index');
    Route::put('/inquiries/{inquiry}/status', [InquiryController::class, 'updateStatus'])->middleware('permission:inquiries.manage')->name('inquiries.status');

    // Customers, Reviews, Policies & Pages
    Route::get('/customers', [CustomerController::class, 'index'])->middleware('permission:orders.view')->name('customers.index');
    Route::put('/customers/{customer}/toggle', [CustomerController::class, 'toggleStatus'])->middleware('permission:orders.manage')->name('customers.toggle');
    Route::get('/reviews', [ReviewController::class, 'index'])->middleware('permission:products.edit')->name('reviews.index');
    Route::put('/reviews/{review}/toggle', [ReviewController::class, 'toggleApprove'])->middleware('permission:products.edit')->name('reviews.toggle');
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])->middleware('permission:products.edit')->name('reviews.destroy');
    Route::get('/policies', [PolicyController::class, 'index'])->middleware('permission:settings.manage')->name('policies.index');
    Route::post('/policies', [PolicyController::class, 'update'])->middleware('permission:settings.manage')->name('policies.update');
});
