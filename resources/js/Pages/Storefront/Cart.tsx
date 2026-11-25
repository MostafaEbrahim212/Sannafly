import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, MapPin, Minus, Package, Plus, ShieldCheck, ShoppingBag, Tag, Trash2, Truck, X } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import { useTranslation } from '@/lib/i18n';
import type { PageProps } from '@/types';

interface CartItem {
    key: string;
    product_id: number;
    variation_id?: number | null;
    name: string;
    sku: string;
    unit_price: number;
    quantity: number;
    image?: string | null;
}

interface ShippingZoneItem {
    id: number;
    name: string;
    name_ar?: string | null;
    cities?: string[];
    rate: string | number;
    free_shipping_threshold?: string | number | null;
    estimated_days?: string | null;
    is_default: boolean;
}

interface CartProps {
    items: CartItem[];
    savedAddresses?: any[];
    paymentMethods: Array<{
        id: number;
        name: string;
        name_ar?: string | null;
        driver?: string;
        description?: string | null;
        description_ar?: string | null;
        public_meta?: {
            bank_name?: string | null;
            account_name?: string | null;
            account_number?: string | null;
            iban?: string | null;
            pickup_address?: string | null;
            pickup_hours?: string | null;
        } | null;
    }>;
    shippingZones?: ShippingZoneItem[];
    appliedCoupon?: { code: string; type: string; value: number; discount_amount: number } | null;
    idempotencyKey: string;
}

export default function Cart({ items, savedAddresses = [], paymentMethods, shippingZones = [], appliedCoupon = null, idempotencyKey }: CartProps) {
    const { auth } = usePage<PageProps>().props;
    const { t, localized, formatPrice, locale } = useTranslation();
    const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const [couponInput, setCouponInput] = useState('');
    const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
    const [selectedAddrId, setSelectedAddrId] = useState<number | null>(defaultAddr?.id ?? null);

    const form = useForm({
        customer_name: defaultAddr?.recipient_name || auth.customer?.name || '',
        customer_email: auth.customer?.email || '',
        customer_phone: defaultAddr?.phone || auth.customer?.phone || '',
        shipping_address: {
            city: defaultAddr?.city || '',
            area: defaultAddr?.area || '',
            street: defaultAddr?.street || '',
            building: defaultAddr?.building || '',
            floor: defaultAddr?.floor || '',
            apartment: defaultAddr?.apartment || '',
        },
        payment_method_id: paymentMethods[0]?.id || '',
        notes: '',
        save_address: false,
        idempotency_key: idempotencyKey,
    });

    const pickAddress = (addr: any) => {
        setSelectedAddrId(addr.id);
        form.setData({
            ...form.data,
            customer_name: addr.recipient_name,
            customer_phone: addr.phone,
            shipping_address: {
                city: addr.city || '',
                area: addr.area || '',
                street: addr.street || '',
                building: addr.building || '',
                floor: addr.floor || '',
                apartment: addr.apartment || '',
            },
        });
    };

    const updateQty = (key: string, nextQty: number) => {
        if (nextQty < 1) return;
        router.put(`/cart/${key}`, { quantity: nextQty }, { preserveScroll: true, preserveState: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/checkout');
    };

    const err = form.errors as Record<string, string>;

    const discountAmount = appliedCoupon?.discount_amount ?? 0;
    const netSubtotal = Math.max(0, total - discountAmount);

    const selectedPaymentMethod = paymentMethods.find((pm) => String(pm.id) === String(form.data.payment_method_id));
    const isStorePickup = selectedPaymentMethod?.driver === 'cash';

    const shippingInfo = useMemo(() => {
        if (isStorePickup) {
            return {
                zone: {
                    id: 0,
                    name: 'Store Pickup',
                    name_ar: 'استلام من المتجر',
                    rate: 0,
                    is_default: false,
                } as ShippingZoneItem,
                cost: 0,
            };
        }
        if (shippingZones.length === 0) return { zone: null as ShippingZoneItem | null, cost: 0 };
        const city = (form.data.shipping_address.city || '').trim().toLowerCase();
        let matched = shippingZones.find((z) =>
            city && (z.cities || []).some((c) => {
                const candidate = c.trim().toLowerCase();
                return candidate && (city.includes(candidate) || candidate.includes(city));
            })
        );
        if (!matched) {
            matched = shippingZones.find((z) => z.is_default) || shippingZones[0];
        }
        const threshold = matched.free_shipping_threshold ? Number(matched.free_shipping_threshold) : null;
        const cost = threshold !== null && netSubtotal >= threshold ? 0 : Number(matched.rate || 0);
        return { zone: matched, cost };
    }, [shippingZones, form.data.shipping_address.city, netSubtotal, isStorePickup]);

    const grandTotal = netSubtotal + shippingInfo.cost;

    const applyCoupon = () => {
        if (!couponInput.trim()) return;
        router.post('/cart/coupon', { code: couponInput.trim() }, { preserveScroll: true, preserveState: true });
    };

    const removeCoupon = () => {
        router.delete('/cart/coupon', { preserveScroll: true, preserveState: true });
    };

    return (
        <StorefrontLayout>
            <SeoHead title={t('cart')} noIndex />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">{t('cart')}</h1>

                {items.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <div className="text-slate-500 font-medium mb-5">{t('empty_cart')}</div>
                        <Link href="/catalog" className="inline-block px-6 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold">
                            {t('browse_all')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-6 space-y-3.5">
                            {items.map((item) => (
                                <div key={item.key} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden flex items-center justify-center shrink-0">
                                            {item.image ? (
                                                <img src={`/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-900 truncate">{item.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{item.sku} • {formatPrice(item.unit_price)}</div>
                                            <div className="mt-2 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.key, item.quantity - 1)}
                                                    className="p-1.5 text-slate-600 hover:text-slate-900"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="px-2.5 text-xs font-bold">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.key, item.quantity + 1)}
                                                    className="p-1.5 text-slate-600 hover:text-slate-900"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-extrabold text-teal-700">{formatPrice(item.unit_price * item.quantity)}</span>
                                        <button
                                            onClick={() => router.delete(`/cart/${item.key}`)}
                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Checkout Form */}
                        <form onSubmit={submit} className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5 h-fit">
                            {/* Coupon Input */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span>{appliedCoupon.code}</span>
                                            <span>(-{formatPrice(discountAmount)})</span>
                                        </span>
                                        <button type="button" onClick={removeCoupon} className="text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 font-semibold">
                                            <X className="w-3.5 h-3.5" />
                                            <span>{locale === 'ar' ? 'إزالة' : 'Remove'}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                            placeholder={locale === 'ar' ? 'كود الخصم (مثال: SAVE10)' : 'Promo / Coupon code'}
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono uppercase"
                                        />
                                        <button
                                            type="button"
                                            onClick={applyCoupon}
                                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                                        >
                                            {locale === 'ar' ? 'تطبيق' : 'Apply'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 border-b border-slate-100 pb-4 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'} ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                                    <span className="font-semibold">{formatPrice(total)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>{locale === 'ar' ? 'الخصم' : 'Discount'} ({appliedCoupon?.code})</span>
                                        <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                                        <span>
                                            {locale === 'ar' ? 'الشحن' : 'Shipping'}
                                            {shippingInfo.zone ? ` (${localized(shippingInfo.zone.name, shippingInfo.zone.name_ar)})` : ''}
                                        </span>
                                    </span>
                                    <span className="font-semibold">
                                        {shippingInfo.cost === 0 ? (locale === 'ar' ? 'مجاني' : 'Free') : formatPrice(shippingInfo.cost)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <span className="font-extrabold text-lg">{t('total')}</span>
                                    <span className="text-2xl font-extrabold text-teal-700">{formatPrice(grandTotal)}</span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {locale === 'ar' ? '1. بيانات التواصل' : '1. Contact Information'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder={`${t('full_name')} *`}
                                            value={form.data.customer_name}
                                            onChange={(e) => form.setData('customer_name', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                            required
                                        />
                                        {err.customer_name && <p className="text-xs text-red-600 mt-1">{err.customer_name}</p>}
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder={`${t('phone_number')} *`}
                                            value={form.data.customer_phone}
                                            onChange={(e) => form.setData('customer_phone', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                            required
                                        />
                                        {err.customer_phone && <p className="text-xs text-red-600 mt-1">{err.customer_phone}</p>}
                                    </div>
                                </div>
                                <input
                                    type="email"
                                    placeholder={t('email_optional')}
                                    value={form.data.customer_email}
                                    onChange={(e) => form.setData('customer_email', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                />
                            </div>

                            {/* Shipping Address (Required) */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-teal-700" />
                                    <span>{locale === 'ar' ? '2. عنوان التوصيل (مطلوب)' : '2. Shipping Address (Required)'}</span>
                                </div>

                                {savedAddresses.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {savedAddresses.map((addr) => (
                                            <button
                                                key={addr.id}
                                                type="button"
                                                onClick={() => pickAddress(addr)}
                                                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                                    selectedAddrId === addr.id
                                                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                                                        : 'border-slate-200 bg-slate-50 hover:border-teal-400'
                                                }`}
                                            >
                                                {addr.label} ({addr.city})
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder={locale === 'ar' ? 'المحافظة / المدينة *' : 'City *'}
                                            value={form.data.shipping_address.city}
                                            onChange={(e) => form.setData('shipping_address', { ...form.data.shipping_address, city: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                            required
                                        />
                                        {err['shipping_address.city'] && <p className="text-xs text-red-600 mt-1">{err['shipping_address.city']}</p>}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'المنطقة / الحي' : 'Area / District'}
                                        value={form.data.shipping_address.area}
                                        onChange={(e) => form.setData('shipping_address', { ...form.data.shipping_address, area: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'اسم الشارع ورقم العقار بالتفصيل *' : 'Street Address *'}
                                        value={form.data.shipping_address.street}
                                        onChange={(e) => form.setData('shipping_address', { ...form.data.shipping_address, street: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white"
                                        required
                                    />
                                    {err['shipping_address.street'] && <p className="text-xs text-red-600 mt-1">{err['shipping_address.street']}</p>}
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'مبنى' : 'Bldg'}
                                        value={form.data.shipping_address.building}
                                        onChange={(e) => form.setData('shipping_address', { ...form.data.shipping_address, building: e.target.value })}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'الدور' : 'Floor'}
                                        value={form.data.shipping_address.floor}
                                        onChange={(e) => form.setData('shipping_address', { ...form.data.shipping_address, floor: e.target.value })}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'شقة' : 'Apt'}
                                        value={form.data.shipping_address.apartment}
                                        onChange={(e) => form.setData('shipping_address', { ...form.data.shipping_address, apartment: e.target.value })}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                                    />
                                </div>

                                <textarea
                                    rows={2}
                                    placeholder={locale === 'ar' ? 'ملاحظات إضافية للمندوب (اختياري)' : 'Order notes (optional)'}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
                                />

                                {auth.customer && !selectedAddrId && (
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={form.data.save_address}
                                            onChange={(e) => form.setData('save_address', e.target.checked)}
                                        />
                                        <span>{locale === 'ar' ? 'حفظ هذا العنوان في حسابي للمرات القادمة' : 'Save this address to my account'}</span>
                                    </label>
                                )}
                            </div>

                            {/* Payment Methods */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    3. {t('payment_methods')}
                                </label>
                                <div className="space-y-2">
                                    {paymentMethods.map((pm) => {
                                        const selected = String(form.data.payment_method_id) === String(pm.id);
                                        return (
                                            <label
                                                key={pm.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                    selected ? 'border-teal-600 bg-teal-50/60' : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_method_id"
                                                    checked={selected}
                                                    onChange={() => form.setData('payment_method_id', pm.id)}
                                                    className="mt-1 text-teal-600"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold flex items-center gap-1.5">
                                                        <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                                                        <span>{localized(pm.name, pm.name_ar)}</span>
                                                    </div>
                                                    {(pm.description || pm.description_ar) && (
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            {localized(pm.description, pm.description_ar)}
                                                        </div>
                                                    )}
                                                    {selected && pm.driver === 'bank_transfer' && pm.public_meta?.bank_name && (
                                                        <div className="mt-2 p-2.5 rounded-lg bg-white border border-teal-200 text-[11px] text-slate-700 space-y-0.5">
                                                            <div><strong>{locale === 'ar' ? 'البنك:' : 'Bank:'}</strong> {pm.public_meta.bank_name}</div>
                                                            {pm.public_meta.account_name && <div><strong>{locale === 'ar' ? 'الحساب:' : 'Account:'}</strong> {pm.public_meta.account_name}</div>}
                                                            {pm.public_meta.account_number && <div className="font-mono"><strong>{locale === 'ar' ? 'رقم الحساب:' : 'Acc #:'}</strong> {pm.public_meta.account_number}</div>}
                                                            {pm.public_meta.iban && <div className="font-mono"><strong>IBAN:</strong> {pm.public_meta.iban}</div>}
                                                        </div>
                                                    )}
                                                    {selected && pm.driver === 'cash' && pm.public_meta?.pickup_address && (
                                                        <div className="mt-2 p-2.5 rounded-lg bg-white border border-teal-200 text-[11px] text-slate-700 space-y-0.5">
                                                            <div><strong>{locale === 'ar' ? 'عنوان الاستلام:' : 'Pickup:'}</strong> {pm.public_meta.pickup_address}</div>
                                                            {pm.public_meta.pickup_hours && <div><strong>{locale === 'ar' ? 'المواعيد:' : 'Hours:'}</strong> {pm.public_meta.pickup_hours}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{locale === 'ar' ? 'تأكيد وإرسال الطلب' : t('place_order')}</span>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
