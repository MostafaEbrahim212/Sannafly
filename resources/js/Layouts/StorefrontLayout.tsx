import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Copy, Globe, Heart, LogOut, Mail, Megaphone, MessageCircle, PackageSearch, Phone, Search, ShoppingBag, Sparkles, Tag, User, X, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { applyThemeSettings } from '@/lib/theme';
import BrandLogo from '@/Components/BrandLogo';
import type { PageProps } from '@/types';

interface StorefrontLayoutProps {
    children: React.ReactNode;
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
    const { auth, cartCount, flash, settings } = usePage<PageProps>().props;
    const { t, localized, locale, dir } = useTranslation();
    const [search, setSearch] = useState('');
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [barDismissed, setBarDismissed] = useState(false);
    const [popupOpen, setPopupOpen] = useState(false);
    const [copiedCoupon, setCopiedCoupon] = useState(false);

    useEffect(() => {
        if (!settings.promo_popup_enabled) return;
        if (typeof window !== 'undefined' && sessionStorage.getItem('sf_popup_dismissed') === '1') return;
        const delayMs = Math.max(0, Number(settings.promo_popup_delay ?? 2)) * 1000;
        const timer = setTimeout(() => setPopupOpen(true), delayMs);
        return () => clearTimeout(timer);
    }, [settings.promo_popup_enabled, settings.promo_popup_delay]);

    const closePopup = () => {
        setPopupOpen(false);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('sf_popup_dismissed', '1');
        }
    };

    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = locale;
    }, [dir, locale]);

    useEffect(() => {
        applyThemeSettings(settings);
    }, [settings.primary_color, settings.accent_color, settings.text_color, settings.theme_surface, settings.border_radius]);

    useEffect(() => {
        if (flash?.success) {
            setToast({ type: 'success', text: flash.success });
            const timer = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({ type: 'error', text: flash.error });
            const timer = setTimeout(() => setToast(null), 4500);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    const siteName = localized(settings.site_name || 'Sannafly', settings.site_name_ar);
    const primaryColor = settings.primary_color || '#0f766e';

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setMobileSearchOpen(false);
        router.get('/catalog', { search });
    };

    const promoBarText = localized(settings.promo_bar_text, settings.promo_bar_text_ar);
    const promoBarBtn = localized(settings.promo_bar_btn_text, settings.promo_bar_btn_text_ar);
    const showPromoBar = Boolean(settings.promo_bar_enabled) && !barDismissed && Boolean(promoBarText);

    return (
        <div dir={dir} className="min-h-screen flex flex-col bg-[var(--cf-bg,#fafbfc)] text-[var(--cf-text,#0f172a)]">
            {/* Customizable Top Announcement / News Bar */}
            {showPromoBar && (
                <div
                    className="relative z-40 text-xs font-semibold py-2 px-4 overflow-hidden"
                    style={{
                        backgroundColor: settings.promo_bar_bg || '#063F3C',
                        color: settings.promo_bar_text_color || '#FFFFFF',
                    }}
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex-1 overflow-hidden flex items-center gap-2 min-w-0">
                            <Megaphone className="w-3.5 h-3.5 shrink-0 opacity-90" />
                            {settings.promo_bar_marquee ? (
                                <div className="overflow-hidden flex-1" dir="ltr">
                                    <div className={`${dir === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee'} gap-10`}>
                                        <span dir={dir}>{promoBarText}</span>
                                        <span aria-hidden="true">•</span>
                                        <span dir={dir} aria-hidden="true">{promoBarText}</span>
                                        <span aria-hidden="true">•</span>
                                    </div>
                                </div>
                            ) : (
                                <span dir="auto" className="truncate">{promoBarText}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {promoBarBtn && settings.promo_bar_link && (
                                <Link
                                    href={settings.promo_bar_link}
                                    className="px-3 py-1 rounded-full text-[11px] font-extrabold text-slate-950 shadow-xs hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: settings.promo_bar_btn_color || '#F6A21E' }}
                                >
                                    {promoBarBtn}
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={() => setBarDismissed(true)}
                                className="p-1 rounded-lg opacity-75 hover:opacity-100"
                                aria-label="Close announcement"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle Top Utility Bar */}
            <div className="bg-slate-950 text-slate-300 text-[11px] py-2 border-b border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 truncate">
                        {settings.contact_phone && (
                            <span className="inline-flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-teal-400" />
                                <span dir="ltr">{settings.contact_phone}</span>
                            </span>
                        )}
                        {settings.contact_email && (
                            <span className="hidden sm:inline-flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-teal-400" />
                                <span>{settings.contact_email}</span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        {settings.module_ecommerce && (
                            <Link href="/track-order" className="hover:text-white inline-flex items-center gap-1 transition-colors">
                                <PackageSearch className="w-3 h-3" />
                                <span>{locale === 'ar' ? 'تتبع طلبك' : 'Track Order'}</span>
                            </Link>
                        )}
                        <a href={`/locale/${locale === 'ar' ? 'en' : 'ar'}`} className="hover:text-white inline-flex items-center gap-1 font-semibold">
                            <Globe className="w-3 h-3" />
                            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <BrandLogo variant="light" customName={siteName} />
                    </Link>

                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('search_placeholder')}
                            className="w-full ps-5 pe-11 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                        />
                        <button type="submit" className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    <nav className="flex items-center gap-2 sm:gap-4 text-sm font-semibold">
                        <button
                            type="button"
                            onClick={() => setMobileSearchOpen((v) => !v)}
                            className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                            aria-label="Search"
                        >
                            {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                        </button>

                        <Link href="/" className="text-slate-600 hover:text-slate-950 hidden sm:inline px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                            {t('home')}
                        </Link>
                        <Link href="/catalog" className="text-slate-600 hover:text-slate-950 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                            {t('catalog')}
                        </Link>

                        {settings.module_ecommerce && settings.module_cart && (
                            <Link
                                href="/cart"
                                className="relative inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                            >
                                <ShoppingBag className="w-4 h-4 text-slate-700" />
                                <span className="hidden sm:inline text-xs">{t('cart')}</span>
                                {cartCount > 0 && (
                                    <span
                                        className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {auth.customer ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/wishlist"
                                    title={locale === 'ar' ? 'المفضلة' : 'Wishlist'}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <Heart className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/profile"
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                                >
                                    <User className="w-3.5 h-3.5 text-teal-700" />
                                    <span>{auth.customer.name}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => router.post('/logout')}
                                    title={t('logout')}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">
                                    {t('login')}
                                </Link>
                                <Link
                                    href="/register"
                                    className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {locale === 'ar' ? 'حساب جديد' : 'Register'}
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>

                {mobileSearchOpen && (
                    <div className="md:hidden px-4 pb-3 border-t border-slate-100 pt-2.5 bg-white">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('search_placeholder')}
                                autoFocus
                                className="w-full ps-4 pe-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none"
                            />
                            <button type="submit" className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {children}
            </main>

            {toast && (
                <div className="fixed bottom-5 end-5 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-3">
                    <div
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold backdrop-blur-md ${
                            toast.type === 'success'
                                ? 'bg-slate-900/95 text-white border-slate-800'
                                : 'bg-rose-600/95 text-white border-rose-500'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                            <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                        )}
                        <span className="flex-1">{toast.text}</span>
                        <button type="button" onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Customizable Promotional Popup Modal */}
            {popupOpen && settings.promo_popup_enabled && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={closePopup}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="p-6 text-white relative"
                            style={{ background: `linear-gradient(135deg, #063F3C 0%, ${settings.promo_popup_bg || '#0A5C57'} 100%)` }}
                        >
                            <button
                                type="button"
                                onClick={closePopup}
                                className="absolute top-4 end-4 p-1.5 rounded-full bg-white/15 text-white hover:bg-white/25"
                                aria-label="Close popup"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {(settings.promo_popup_badge || settings.promo_popup_badge_ar) && (
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold text-slate-950 mb-3"
                                    style={{ backgroundColor: settings.accent_color || '#F6A21E' }}
                                >
                                    {localized(settings.promo_popup_badge, settings.promo_popup_badge_ar)}
                                </span>
                            )}
                            <h3 className="text-xl sm:text-2xl font-extrabold leading-snug">
                                {localized(settings.promo_popup_title, settings.promo_popup_title_ar)}
                            </h3>
                        </div>

                        <div className="p-6 space-y-5 text-center">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {localized(settings.promo_popup_body, settings.promo_popup_body_ar)}
                            </p>

                            {settings.promo_popup_coupon && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(settings.promo_popup_coupon);
                                        setCopiedCoupon(true);
                                        setTimeout(() => setCopiedCoupon(false), 2000);
                                    }}
                                    className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-50/70 flex items-center justify-center gap-2.5 text-teal-900 font-mono font-extrabold text-base hover:bg-teal-50 transition-colors"
                                >
                                    <Tag className="w-4 h-4 text-teal-700" />
                                    <span>{settings.promo_popup_coupon}</span>
                                    <Copy className="w-4 h-4 text-teal-600 ms-1" />
                                    {copiedCoupon && (
                                        <span className="text-xs font-sans text-emerald-700 font-bold">
                                            ({locale === 'ar' ? 'تم النسخ!' : 'Copied!'})
                                        </span>
                                    )}
                                </button>
                            )}

                            <div className="flex gap-2.5">
                                {settings.promo_popup_link && (
                                    <Link
                                        href={settings.promo_popup_link}
                                        onClick={closePopup}
                                        className="flex-1 py-3 px-5 rounded-xl text-white font-bold text-sm shadow-sm hover:opacity-95 transition-opacity"
                                        style={{ backgroundColor: settings.promo_popup_bg || '#0A5C57' }}
                                    >
                                        {localized(settings.promo_popup_btn_text, settings.promo_popup_btn_text_ar) || t('browse_all')}
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={closePopup}
                                    className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                                >
                                    {locale === 'ar' ? 'لاحقاً' : 'Later'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-slate-950 text-slate-300 mt-24 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
                    <div>
                        <BrandLogo variant="dark" customName={siteName} />
                        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                            {localized(settings.site_description, settings.site_description_ar)}
                        </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                        <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                            {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                        </div>
                        <div><Link href="/" className="text-slate-400 hover:text-white transition-colors">{t('home')}</Link></div>
                        <div><Link href="/catalog" className="text-slate-400 hover:text-white transition-colors">{t('catalog')}</Link></div>
                        <div><Link href="/about" className="text-slate-400 hover:text-white transition-colors">{locale === 'ar' ? 'من نحن' : 'About Us'}</Link></div>
                        <div><Link href="/contact" className="text-slate-400 hover:text-white transition-colors">{locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}</Link></div>
                        {settings.module_ecommerce && (
                            <div><Link href="/track-order" className="text-slate-400 hover:text-white transition-colors">{locale === 'ar' ? 'تتبع طلبك' : 'Track Order'}</Link></div>
                        )}
                    </div>

                    <div className="space-y-2.5 text-sm">
                        <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                            {locale === 'ar' ? 'السياسات والشروط' : 'Legal & Policies'}
                        </div>
                        <div><Link href="/policies/privacy-policy" className="text-slate-400 hover:text-white transition-colors">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></div>
                        <div><Link href="/policies/terms" className="text-slate-400 hover:text-white transition-colors">{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link></div>
                        <div><Link href="/policies/refund-policy" className="text-slate-400 hover:text-white transition-colors">{locale === 'ar' ? 'سياسة الاسترجاع' : 'Return & Refund Policy'}</Link></div>
                    </div>

                    <div className="space-y-3">
                        <div className="font-bold text-white text-xs uppercase tracking-wider">
                            {locale === 'ar' ? 'تواصل معنا' : 'Customer Support'}
                        </div>
                        {settings.module_whatsapp && settings.whatsapp_number && (
                            <a
                                href={`https://wa.me/${settings.whatsapp_number}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>{t('whatsapp_inquiry')}</span>
                            </a>
                        )}
                        <div className="text-slate-500 text-xs pt-2">© {new Date().getFullYear()} {siteName}</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
