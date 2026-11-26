import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, Check, CheckCheck, CreditCard, ExternalLink, ShoppingBag, Trash2 } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { useTranslation } from '@/lib/i18n';
import type { RealtimeNotificationItem } from '@/lib/useRealtime';

interface Props {
    notifications: {
        data: RealtimeNotificationItem[];
        total: number;
    };
    unreadCount: number;
    filter: string;
}

export default function CustomerNotifications({ notifications, unreadCount, filter }: Props) {
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    const markRead = (id: string) => router.post(`/account/notifications/${id}/read`, {}, { preserveScroll: true });
    const markAllRead = () => router.post('/account/notifications/read-all', {}, { preserveScroll: true });
    const deleteItem = (id: string) => router.delete(`/account/notifications/${id}`, { preserveScroll: true });

    return (
        <StorefrontLayout>
            <Head title={isAr ? 'إشعاراتي' : 'My Notifications'} />

            <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="w-6 h-6 text-teal-700 dark:text-teal-400" />
                            {isAr ? 'إشعاراتي وتحديثات الطلبات' : 'My Notifications'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isAr
                                ? 'تابع تحديثات طلباتك وحالات الدفع والشحن لحظة بلحظة.'
                                : 'Real-time updates for your orders, payments, and shipments.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.get('/account/notifications', { filter: filter === 'unread' ? 'all' : 'unread' }, { replace: true })}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            {filter === 'unread'
                                ? isAr
                                    ? 'عرض الكل'
                                    : 'Show All'
                                : isAr
                                  ? `غير مقروء (${unreadCount})`
                                  : `Unread (${unreadCount})`}
                        </button>
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
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {notifications.data.length === 0 ? (
                        <div className="p-12 text-center text-sm text-slate-500">
                            <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            {isAr ? 'لا توجد إشعارات حتى الآن.' : 'You have no notifications yet.'}
                        </div>
                    ) : (
                        notifications.data.map((n) => {
                            const isUnread = !n.read_at;
                            const isPayment = n.data.category === 'payment';
                            const Icon = isPayment ? CreditCard : ShoppingBag;
                            const title = isAr ? n.data.title_ar || n.data.title_en : n.data.title_en;
                            const body = isAr ? n.data.body_ar || n.data.body_en : n.data.body_en;

                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 flex items-start justify-between gap-4 ${
                                        isUnread ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold">{title}</span>
                                                {isUnread && <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />}
                                                <span className="text-[11px] text-slate-400">{n.human_time}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{body}</p>
                                            {n.data.url && (
                                                <Link
                                                    href={n.data.url}
                                                    onClick={() => isUnread && markRead(n.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 mt-2 hover:underline"
                                                >
                                                    {isAr ? 'متابعة الطلب' : 'View Order'}
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
                                                className="p-2 rounded-lg text-teal-700 dark:text-teal-400 hover:bg-teal-50"
                                                title={isAr ? 'تحديد كمقروء' : 'Mark as read'}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteItem(n.id)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
        </StorefrontLayout>
    );
}
