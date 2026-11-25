import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { MapPin, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { EGYPT_GOVERNORATES, type Governorate } from '@/lib/governorates';
import { useTranslation } from '@/lib/i18n';

export default function ShippingZonesIndex({ zones }: { zones: any[] }) {
    const { locale, formatPrice, localized } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        name: '',
        name_ar: '',
        cities_text: '',
        rate: '30',
        free_shipping_threshold: '',
        estimated_days: '2-3 days',
        is_default: false,
        is_active: true,
        sort_order: 0,
    });

    const parseCities = (text: string): string[] =>
        text
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

    const isGovSelected = (gov: Governorate): boolean => {
        const current = parseCities(form.data.cities_text).map((c) => c.toLowerCase());
        return current.includes(gov.en.toLowerCase()) || current.includes(gov.ar.toLowerCase());
    };

    const toggleGovernorate = (gov: Governorate) => {
        const current = parseCities(form.data.cities_text);
        const selected = isGovSelected(gov);
        const next = selected
            ? current.filter((c) => c.toLowerCase() !== gov.en.toLowerCase() && c.toLowerCase() !== gov.ar.toLowerCase())
            : [...current, gov.en, gov.ar];
        form.setData('cities_text', Array.from(new Set(next)).join(', '));
    };

    const selectRegion = (region: Governorate['region']) => {
        const current = parseCities(form.data.cities_text);
        const toAdd = EGYPT_GOVERNORATES.filter((g) => g.region === region).flatMap((g) => [g.en, g.ar]);
        form.setData('cities_text', Array.from(new Set([...current, ...toAdd])).join(', '));
    };

    const openCreate = () => {
        setEditingId(null);
        form.reset();
        setShowModal(true);
    };

    const openEdit = (zone: any) => {
        setEditingId(zone.id);
        form.setData({
            name: zone.name || '',
            name_ar: zone.name_ar || '',
            cities_text: Array.isArray(zone.cities) ? zone.cities.join(', ') : '',
            rate: String(zone.rate ?? '0'),
            free_shipping_threshold: zone.free_shipping_threshold !== null && zone.free_shipping_threshold !== undefined ? String(zone.free_shipping_threshold) : '',
            estimated_days: zone.estimated_days || '',
            is_default: Boolean(zone.is_default),
            is_active: Boolean(zone.is_active ?? true),
            sort_order: Number(zone.sort_order ?? 0),
        });
        setShowModal(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                setShowModal(false);
                setEditingId(null);
                form.reset();
            },
        };

        if (editingId) {
            form.put(`/admin/shipping-zones/${editingId}`, options);
        } else {
            form.post('/admin/shipping-zones', options);
        }
    };

    return (
        <AdminLayout title={locale === 'ar' ? 'مناطق وتكاليف الشحن' : 'Shipping Zones & Rates'}>
            <Head title="Shipping Zones" />

            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-500">
                    {locale === 'ar' ? 'تحديد أسعار الشحن والمحافظات المشمولة وحد الشحن المجاني' : 'Configure delivery rates by governorate and free shipping thresholds'}
                </p>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إضافة منطقة شحن' : 'New Zone'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((z) => (
                    <div key={z.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{localized(z.name, z.name_ar)}</h3>
                                    {z.estimated_days && <p className="text-xs text-slate-400">{z.estimated_days}</p>}
                                </div>
                            </div>
                            {z.is_default && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">DEFAULT</span>
                            )}
                        </div>

                        <div className="flex items-baseline justify-between text-sm pt-2 border-t">
                            <span className="text-slate-500">{locale === 'ar' ? 'سعر الشحن' : 'Rate'}:</span>
                            <span className="font-extrabold text-teal-700">{formatPrice(z.rate)}</span>
                        </div>

                        {z.free_shipping_threshold && (
                            <div className="flex items-baseline justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <span>{locale === 'ar' ? 'شحن مجاني فوق' : 'Free shipping over'}</span>
                                <span className="font-bold">{formatPrice(z.free_shipping_threshold)}</span>
                            </div>
                        )}

                        <div className="text-xs text-slate-500 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                            <span>{(z.cities || []).length > 0 ? z.cities.join(', ') : locale === 'ar' ? 'باقي المحافظات' : 'All other governorates (fallback)'}</span>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <button
                                type="button"
                                onClick={() => openEdit(z)}
                                className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-semibold"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'تعديل' : 'Edit'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Delete this shipping zone?')) router.delete(`/admin/shipping-zones/${z.id}`);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'حذف' : 'Delete'}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg">
                            {editingId
                                ? locale === 'ar' ? 'تعديل منطقة الشحن' : 'Edit Shipping Zone'
                                : locale === 'ar' ? 'إضافة منطقة شحن' : 'New Shipping Zone'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Name (EN) *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Cairo & Giza"
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Name (AR)</label>
                                <input
                                    type="text"
                                    value={form.data.name_ar}
                                    onChange={(e) => form.setData('name_ar', e.target.value)}
                                    placeholder="القاهرة والجيزة"
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="block text-xs font-semibold">
                                    {locale === 'ar' ? 'اختر المحافظات المشمولة' : 'Select Covered Governorates'}
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    <button type="button" onClick={() => selectRegion('greater_cairo')} className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium">
                                        {locale === 'ar' ? '+ القاهرة الكبرى' : '+ Greater Cairo'}
                                    </button>
                                    <button type="button" onClick={() => selectRegion('alex_delta')} className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium">
                                        {locale === 'ar' ? '+ الإسكندرية والدلتا' : '+ Alex & Delta'}
                                    </button>
                                    <button type="button" onClick={() => selectRegion('canal')} className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium">
                                        {locale === 'ar' ? '+ القناة' : '+ Canal'}
                                    </button>
                                    <button type="button" onClick={() => selectRegion('upper_egypt')} className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium">
                                        {locale === 'ar' ? '+ الصعيد' : '+ Upper Egypt'}
                                    </button>
                                    <button type="button" onClick={() => selectRegion('frontier')} className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-medium">
                                        {locale === 'ar' ? '+ الحدود' : '+ Frontier'}
                                    </button>
                                    <button type="button" onClick={() => form.setData('cities_text', '')} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-medium">
                                        {locale === 'ar' ? 'مسح' : 'Clear'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border bg-slate-50 max-h-44 overflow-y-auto">
                                {EGYPT_GOVERNORATES.map((gov) => {
                                    const active = isGovSelected(gov);
                                    return (
                                        <button
                                            key={gov.code}
                                            type="button"
                                            onClick={() => toggleGovernorate(gov)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                                                active
                                                    ? 'bg-teal-700 text-white border-teal-700'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                                            }`}
                                        >
                                            {locale === 'ar' ? gov.ar : gov.en}
                                        </button>
                                    );
                                })}
                            </div>
                            <input
                                type="text"
                                value={form.data.cities_text}
                                onChange={(e) => form.setData('cities_text', e.target.value)}
                                placeholder={locale === 'ar' ? 'أو أضف مدن مخصصة مفصولة بفاصلة...' : 'Or custom cities (comma-separated)...'}
                                className="w-full px-3 py-2 rounded-lg border text-xs text-slate-600"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Rate *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={form.data.rate}
                                    onChange={(e) => form.setData('rate', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Free Over</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.data.free_shipping_threshold}
                                    onChange={(e) => form.setData('free_shipping_threshold', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">ETA</label>
                                <input
                                    type="text"
                                    value={form.data.estimated_days}
                                    onChange={(e) => form.setData('estimated_days', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-sm"
                                />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-xs font-medium">
                            <input
                                type="checkbox"
                                checked={form.data.is_default}
                                onChange={(e) => form.setData('is_default', e.target.checked)}
                            />
                            <span>Set as default fallback zone</span>
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={form.processing} className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-semibold">
                                Save Zone
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
