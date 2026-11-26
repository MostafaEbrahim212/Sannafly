import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Boxes,
    Check,
    CheckCheck,
    CreditCard,
    ExternalLink,
    MessageSquare,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';
import type { RealtimeNotificationItem } from '@/lib/useRealtime';

interface Props {
    notifications: {
        data: RealtimeNotificationItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    unreadCount: number;
    filter: string;
}

const CATEGORY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; badge: string; labelEn: string; labelAr: string }> = {
    order: { icon: ShoppingBag, badge: 'bg-teal-50 text-teal-700 border-teal-200', labelEn: 'Order', labelAr: 'طلب' },
    payment: { icon: CreditCard, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', labelEn: 'Payment', labelAr: 'دفع' },
    inventory: { icon: Boxes, badge: 'bg-amber-50 text-amber-700 border-amber-200', labelEn: 'Inventory', labelAr: 'مخزون' },
    inquiry: { icon: MessageSquare, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', labelEn: 'Inquiry', labelAr: 'استفسار' },
};

export default function AdminNotificationsIndex({ notifications, unreadCount, filter }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const tabs = [
        { key: 'all', label: isAr ? 'الكل' : 'All' },
        { key: 'unread', label: isAr ? `غير مقروء (${unreadCount})` : `Unread (${unreadCount})` },
        { key: 'order', label: isAr ? 'الطلبات' : 'Orders' },
        { key: 'payment', label: isAr ? 'المدفوعات' : 'Payments' },
        { key: 'inventory', label: isAr ? 'المخزون' : 'Inventory' },
        { key: 'inquiry', label: isAr ? 'الاستفسارات' : 'Inquiries' },
    ];

    const setFilter = (key: string) => {
        router.get('/admin/notifications', { filter: key }, { preserveState: true, replace: true });
    };

    const markRead = (id: string) => {
        router.post(`/admin/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post('/admin/notifications/read-all', {}, { preserveScroll: true });
    };

    const deleteItem = (id: string) => {
        router.delete(`/admin/notifications/${id}`, { preserveScroll: true });
    };

    const clearRead = () => {
        router.delete('/admin/notifications', { preserveScroll: true });
    };

    return (
        <AdminLayout title={isAr ? 'الإشعارات' : 'Notifications'}>
            <Head title={isAr ? 'الإشعارات' : 'Notifications'} />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Bell className="w-6 h-6 text-teal-600" />
                            {isAr ? 'مركز الإشعارات الفورية' : 'Real-Time Notifications Center'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isAr
                                ? 'جميع إشعارات الطلبات الجديدة، حالات الدفع، تنبيهات المخزون، واستفسارات العملاء.'
                                : 'Live updates for new orders, payment callbacks, low-stock alerts, and customer inquiries.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                            >
                                <CheckCheck className="w-4 h-4" />
                                {isAr ? 'تحديد الكل كمقروء' : 'Mark All Read'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={clearRead}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isAr ? 'حذف المقروءة' : 'Clear Read'}
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setFilter(tab.key)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                filter === tab.key
                                    ? 'bg-teal-700 text-white border-teal-700'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {notifications.data.length === 0 ? (
                        <div className="p-12 text-center text-sm text-slate-500">
                            <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            {isAr ? 'لا توجد إشعارات في هذا التصنيف حاليًا.' : 'No notifications found for this filter.'}
                        </div>
                    ) : (
                        notifications.data.map((n) => {
                            const meta = CATEGORY_META[n.data.category] || CATEGORY_META.order;
                            const Icon = meta.icon;
                            const isUnread = !n.read_at;
                            const title = isAr ? n.data.title_ar || n.data.title_en : n.data.title_en;
                            const body = isAr ? n.data.body_ar || n.data.body_en : n.data.body_en;

                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                                        isUnread ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className={`p-2.5 rounded-xl border shrink-0 ${meta.badge}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {title}
                                                </span>
                                                {isUnread && (
                                                    <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                                                )}
                                                <span className="text-[11px] text-slate-400">{n.human_time}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{body}</p>
                                            {n.data.url && (
                                                <Link
                                                    href={n.data.url}
                                                    onClick={() => isUnread && markRead(n.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 mt-2 hover:underline"
                                                >
                                                    {isAr ? 'عرض التفاصيل' : 'View details'}
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {isUnread && (
                                            <button
                                                type="button"
                                                onClick={() => markRead(n.id)}
                                                className="p-2 rounded-lg text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                                                title={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteItem(n.id)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                            title={isAr ? 'حذف' : 'Delete'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
