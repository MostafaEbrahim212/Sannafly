import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { KeyRound, MapPin, Plus, ShoppingBag, Star, Trash2, User } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import { useTranslation } from '@/lib/i18n';

interface Address {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    country: string;
    city: string;
    area?: string | null;
    street: string;
    building?: string | null;
    floor?: string | null;
    apartment?: string | null;
    postal_code?: string | null;
    notes?: string | null;
    is_default: boolean;
}

export default function Profile({
    customer,
    addresses,
    ordersCount,
}: {
    customer: any;
    addresses: Address[];
    ordersCount: number;
}) {
    const { t, locale } = useTranslation();
    const [tab, setTab] = useState<'info' | 'addresses' | 'security'>('info');
    const [editingAddr, setEditingAddr] = useState<Address | null>(null);
    const [showAddrForm, setShowAddrForm] = useState(false);

    const infoForm = useForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
    });

    const passForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const addrForm = useForm({
        label: 'Home',
        recipient_name: customer.name || '',
        phone: customer.phone || '',
        country: 'Egypt',
        city: '',
        area: '',
        street: '',
        building: '',
        floor: '',
        apartment: '',
        postal_code: '',
        notes: '',
        is_default: false,
    });

    const openNewAddress = () => {
        setEditingAddr(null);
        addrForm.reset();
        addrForm.setData({
            label: 'Home',
            recipient_name: customer.name || '',
            phone: customer.phone || '',
            country: 'Egypt',
            city: '',
            area: '',
            street: '',
            building: '',
            floor: '',
            apartment: '',
            postal_code: '',
            notes: '',
            is_default: addresses.length === 0,
        });
        setShowAddrForm(true);
    };

    const openEditAddress = (addr: Address) => {
        setEditingAddr(addr);
        addrForm.setData({
            label: addr.label,
            recipient_name: addr.recipient_name,
            phone: addr.phone,
            country: addr.country || 'Egypt',
            city: addr.city,
            area: addr.area || '',
            street: addr.street,
            building: addr.building || '',
            floor: addr.floor || '',
            apartment: addr.apartment || '',
            postal_code: addr.postal_code || '',
            notes: addr.notes || '',
            is_default: addr.is_default,
        });
        setShowAddrForm(true);
    };

    const submitAddress = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAddr) {
            addrForm.put(`/profile/addresses/${editingAddr.id}`, {
                onSuccess: () => {
                    setShowAddrForm(false);
                    setEditingAddr(null);
                },
            });
        } else {
            addrForm.post('/profile/addresses', {
                onSuccess: () => setShowAddrForm(false),
            });
        }
    };

    return (
        <StorefrontLayout>
            <Head title={locale === 'ar' ? 'حسابي' : 'My Profile'} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center text-xl font-extrabold shadow-sm">
                            {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900">{customer.name}</h1>
                            <div className="text-xs text-slate-500 mt-0.5">{customer.email} {customer.phone ? `• ${customer.phone}` : ''}</div>
                        </div>
                    </div>

                    <Link
                        href="/my-orders"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold hover:bg-teal-100 transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{locale === 'ar' ? `طلباتي (${ordersCount})` : `My Orders (${ordersCount})`}</span>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { id: 'info', label: locale === 'ar' ? 'البيانات الشخصية' : 'Personal Info', icon: User },
                        { id: 'addresses', label: locale === 'ar' ? `العناوين المحفوظة (${addresses.length})` : `Addresses (${addresses.length})`, icon: MapPin },
                        { id: 'security', label: locale === 'ar' ? 'الأمان وكلمة المرور' : 'Security', icon: KeyRound },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTab(item.id as any)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    tab === item.id
                                        ? 'bg-teal-700 text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab 1: Personal Info */}
                {tab === 'info' && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            infoForm.put('/profile');
                        }}
                        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4 max-w-2xl"
                    >
                        <h2 className="font-bold text-base">{locale === 'ar' ? 'البيانات الأساسية' : 'Personal Information'}</h2>
                        <div>
                            <label className="block text-xs font-semibold mb-1">{t('full_name')}</label>
                            <input
                                type="text"
                                value={infoForm.data.name}
                                onChange={(e) => infoForm.setData('name', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                                required
                            />
                            {infoForm.errors.name && <p className="text-xs text-red-600 mt-1">{infoForm.errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t('email')}</label>
                                <input
                                    type="email"
                                    value={infoForm.data.email}
                                    onChange={(e) => infoForm.setData('email', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                                    required
                                />
                                {infoForm.errors.email && <p className="text-xs text-red-600 mt-1">{infoForm.errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">{t('phone')}</label>
                                <input
                                    type="text"
                                    value={infoForm.data.phone}
                                    onChange={(e) => infoForm.setData('phone', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={infoForm.processing}
                            className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                        >
                            {t('save')}
                        </button>
                    </form>
                )}

                {/* Tab 2: Addresses */}
                {tab === 'addresses' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-base">{locale === 'ar' ? 'دفتر العناوين' : 'Saved Delivery Addresses'}</h2>
                            <button
                                type="button"
                                onClick={openNewAddress}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{locale === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
                            </button>
                        </div>

                        {showAddrForm && (
                            <form onSubmit={submitAddress} className="bg-white rounded-3xl border border-teal-200 p-6 shadow-xs space-y-4">
                                <h3 className="font-bold text-sm">
                                    {editingAddr
                                        ? locale === 'ar' ? 'تعديل العنوان' : 'Edit Address'
                                        : locale === 'ar' ? 'عنوان جديد' : 'New Address'}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'التسمية (المنزل / العمل)' : 'Label (Home / Work)'}
                                        value={addrForm.data.label}
                                        onChange={(e) => addrForm.setData('label', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
                                        value={addrForm.data.recipient_name}
                                        onChange={(e) => addrForm.setData('recipient_name', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder={t('phone')}
                                        value={addrForm.data.phone}
                                        onChange={(e) => addrForm.setData('phone', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'الدولة' : 'Country'}
                                        value={addrForm.data.country}
                                        onChange={(e) => addrForm.setData('country', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'المحافظة / المدينة *' : 'City *'}
                                        value={addrForm.data.city}
                                        onChange={(e) => addrForm.setData('city', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'المنطقة / الحي' : 'Area / District'}
                                        value={addrForm.data.area}
                                        onChange={(e) => addrForm.setData('area', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'الشارع *' : 'Street Address *'}
                                        value={addrForm.data.street}
                                        onChange={(e) => addrForm.setData('street', e.target.value)}
                                        className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'عمارة / مبنى' : 'Building'}
                                        value={addrForm.data.building}
                                        onChange={(e) => addrForm.setData('building', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder={locale === 'ar' ? 'الدور / الشقة' : 'Floor / Apt'}
                                        value={addrForm.data.apartment}
                                        onChange={(e) => addrForm.setData('apartment', e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder={locale === 'ar' ? 'علامة مميزة أو ملاحظات للمندوب' : 'Delivery notes / landmark'}
                                    value={addrForm.data.notes}
                                    onChange={(e) => addrForm.setData('notes', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                />
                                <label className="flex items-center gap-2 text-xs font-semibold">
                                    <input
                                        type="checkbox"
                                        checked={addrForm.data.is_default}
                                        onChange={(e) => addrForm.setData('is_default', e.target.checked)}
                                    />
                                    <span>{locale === 'ar' ? 'تعيين كعنوان افتراضي' : 'Set as default address'}</span>
                                </label>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={addrForm.processing} className="px-5 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold">
                                        {t('save')}
                                    </button>
                                    <button type="button" onClick={() => setShowAddrForm(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                                        {t('cancel')}
                                    </button>
                                </div>
                            </form>
                        )}

                        {addresses.length === 0 ? (
                            <div className="bg-white rounded-3xl border p-12 text-center text-slate-500 text-sm">
                                {locale === 'ar' ? 'لا توجد عناوين محفوظة بعد.' : 'No saved addresses yet.'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between gap-4 ${
                                            addr.is_default ? 'border-teal-500 ring-1 ring-teal-500/20' : 'border-slate-200/80'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-800">
                                                    {addr.label}
                                                </span>
                                                {addr.is_default && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        <span>{locale === 'ar' ? 'الافتراضي' : 'Default'}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-bold text-sm">{addr.recipient_name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{addr.phone}</div>
                                            <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                                                {addr.street}
                                                {addr.building ? `, Bldg ${addr.building}` : ''}
                                                {addr.apartment ? `, Apt ${addr.apartment}` : ''}
                                                <br />
                                                {addr.area ? `${addr.area}, ` : ''}{addr.city}, {addr.country}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                                            <div className="flex gap-3">
                                                <button onClick={() => openEditAddress(addr)} className="font-semibold text-teal-700 hover:underline">
                                                    {t('edit')}
                                                </button>
                                                {!addr.is_default && (
                                                    <button
                                                        onClick={() => router.post(`/profile/addresses/${addr.id}/default`)}
                                                        className="font-semibold text-slate-600 hover:underline"
                                                    >
                                                        {locale === 'ar' ? 'جعله افتراضياً' : 'Set Default'}
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => router.delete(`/profile/addresses/${addr.id}`)}
                                                className="text-rose-500 hover:text-rose-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Security */}
                {tab === 'security' && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            passForm.put('/profile/password', { onSuccess: () => passForm.reset() });
                        }}
                        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4 max-w-xl"
                    >
                        <h2 className="font-bold text-base">{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
                        <div>
                            <label className="block text-xs font-semibold mb-1">
                                {locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                            </label>
                            <input
                                type="password"
                                value={passForm.data.current_password}
                                onChange={(e) => passForm.setData('current_password', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                                required
                            />
                            {passForm.errors.current_password && <p className="text-xs text-red-600 mt-1">{passForm.errors.current_password}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">
                                {locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                            </label>
                            <input
                                type="password"
                                value={passForm.data.password}
                                onChange={(e) => passForm.setData('password', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                                required
                            />
                            {passForm.errors.password && <p className="text-xs text-red-600 mt-1">{passForm.errors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">
                                {locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                            </label>
                            <input
                                type="password"
                                value={passForm.data.password_confirmation}
                                onChange={(e) => passForm.setData('password_confirmation', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={passForm.processing}
                            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                        >
                            {locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </StorefrontLayout>
    );
}
