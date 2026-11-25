import React from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function ReviewsIndex({ reviews }: { reviews: any }) {
    const { locale, localized } = useTranslation();

    return (
        <AdminLayout title={locale === 'ar' ? 'تقييمات المنتجات' : 'Product Reviews'}>
            <Head title="Product Reviews" />

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 border-b">
                        <tr>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'المنتج' : 'Product'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'العميل' : 'Customer'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'التقييم' : 'Rating'}</th>
                            <th className="p-3.5 text-start">{locale === 'ar' ? 'التعليق' : 'Review'}</th>
                            <th className="p-3.5 text-center">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="p-3.5 text-end">{locale === 'ar' ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {reviews.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                    {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews submitted yet.'}
                                </td>
                            </tr>
                        ) : (
                            reviews.data.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                    <td className="p-3.5 font-semibold">
                                        {localized(r.product?.name, r.product?.name_ar)}
                                    </td>
                                    <td className="p-3.5 text-xs">
                                        <div className="font-bold">{r.customer?.name}</div>
                                        {r.is_verified_purchase && (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {locale === 'ar' ? 'شراء مؤكد' : 'Verified'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex items-center text-amber-400">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-current' : 'text-slate-300'}`} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3.5 max-w-sm text-xs">
                                        {r.title && <div className="font-bold text-slate-900">{r.title}</div>}
                                        {r.comment && <p className="text-slate-600 line-clamp-2">{r.comment}</p>}
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                r.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {r.is_approved
                                                ? locale === 'ar' ? 'ظاهر' : 'Published'
                                                : locale === 'ar' ? 'مخفي' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-end">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => router.put(`/admin/reviews/${r.id}/toggle`, {}, { preserveScroll: true })}
                                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                title={r.is_approved ? 'Hide' : 'Approve'}
                                            >
                                                {r.is_approved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Delete this review?')) router.delete(`/admin/reviews/${r.id}`, { preserveScroll: true });
                                                }}
                                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
