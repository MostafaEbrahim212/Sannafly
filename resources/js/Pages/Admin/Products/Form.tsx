import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    DollarSign,
    Image as ImageIcon,
    Layers,
    Package,
    Sparkles,
    Star,
    Trash2,
    Upload,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import VariationsStep, { type VariationRow } from '@/Components/Admin/ProductWizard/VariationsStep';
import { useTranslation } from '@/lib/i18n';
import type { Brand, Category, PriceType, Product } from '@/types';

interface ProductFormProps {
    product: Product | null;
    categories: Category[];
    brands: Brand[];
    priceTypes: PriceType[];
    attributes: Array<{ id: number; name: string; options: Array<{ id: number; value: string; color_hex?: string | null }> }>;
}

export default function ProductForm({ product, categories, brands, priceTypes, attributes }: ProductFormProps) {
    const { locale } = useTranslation();
    const isEdit = Boolean(product);
    const [step, setStep] = useState(1);
    const [showAdvancedPricing, setShowAdvancedPricing] = useState(
        Boolean(product?.prices?.some((p) => p.price_type?.slug !== 'regular' && p.price_type?.slug !== 'sale'))
    );

    const initialPrices = priceTypes.map((pt) => {
        const existing = product?.prices?.find((p) => p.price_type_id === pt.id && !p.variation_id);
        return {
            price_type_id: pt.id,
            name: pt.name,
            name_ar: pt.name_ar,
            slug: pt.slug,
            amount: existing ? String(parseFloat(existing.amount)) : '',
            min_quantity: existing?.min_quantity ?? 1,
        };
    });

    const initialVariations: VariationRow[] = (product?.variations || []).map((v) => ({
        id: v.id,
        name: v.name || '',
        sku: v.sku,
        price: v.prices?.[0]?.amount ? String(parseFloat(v.prices[0].amount)) : '',
        stock_quantity: v.stock_quantity,
        status: v.status,
        is_default: v.is_default,
        option_ids: v.options?.map((o) => o.id) || [],
        existing_image: v.images?.[0]?.thumbnail_path || v.images?.[0]?.path || null,
    }));

    const form = useForm<any>({
        name: product?.name || '',
        name_ar: product?.name_ar || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        category_id: product?.category_id || '',
        brand_id: product?.brand_id || '',
        status: product?.status || 'published',
        visibility: product?.visibility || 'public',
        is_featured: product?.is_featured ?? false,
        has_variations: product?.has_variations ?? false,
        track_inventory: product?.track_inventory ?? true,
        allow_backorder: product?.allow_backorder ?? false,
        stock_quantity: product?.stock_quantity ?? 10,
        low_stock_threshold: product?.low_stock_threshold ?? 5,
        short_description: product?.short_description || '',
        short_description_ar: product?.short_description_ar || '',
        description: product?.description || '',
        description_ar: product?.description_ar || '',
        seo_title: product?.seo_title || '',
        seo_description: product?.seo_description || '',
        prices: initialPrices,
        variations: initialVariations,
        images: [] as File[],
        variation_images: {} as Record<number, File>,
    });

    const regularPrice = form.data.prices.find((p: any) => p.slug === 'regular')?.amount || form.data.prices[0]?.amount || '';

    const imagePreviews = useMemo(
        () => (form.data.images as File[]).map((file) => ({ file, url: URL.createObjectURL(file) })),
        [form.data.images]
    );

    const generateSku = () => {
        const prefix = (form.data.name || 'PRD')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 4) || 'PRD';
        const rand = Math.floor(1000 + Math.random() * 9000);
        form.setData('sku', `${prefix}-${rand}`);
    };

    const submit = (targetStatus?: string) => {
        if (targetStatus) {
            form.transform((data) => ({ ...data, status: targetStatus }));
        }
        const url = isEdit && product ? `/admin/products/${product.id}` : '/admin/products';
        form.post(url, { forceFormData: true });
    };

    const steps = [
        { num: 1, title: locale === 'ar' ? 'البيانات الأساسية' : 'Basic Info', icon: Package },
        { num: 2, title: locale === 'ar' ? 'الأسعار والمخزون' : 'Pricing & Stock', icon: DollarSign },
        { num: 3, title: locale === 'ar' ? 'الصور والمعرض' : 'Images', icon: ImageIcon },
        { num: 4, title: locale === 'ar' ? 'المتغيرات' : 'Variations', icon: Layers },
        { num: 5, title: locale === 'ar' ? 'المراجعة والنشر' : 'Review & Publish', icon: CheckCircle2 },
    ];

    const totalVariationStock = (form.data.variations as VariationRow[]).reduce(
        (sum, v) => sum + (v.status === 'active' ? Number(v.stock_quantity || 0) : 0),
        0
    );

    return (
        <AdminLayout title={isEdit ? `Edit: ${product?.name}` : locale === 'ar' ? 'إضافة منتج جديد' : 'Create New Product'}>
            <Head title={isEdit ? `Edit ${product?.name}` : 'Create Product'} />

            <div className="max-w-5xl mx-auto">
                <div className="mb-5 flex items-center justify-between">
                    <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'العودة للمنتجات' : 'Back to Products'}</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => submit()}
                        disabled={form.processing}
                        className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                    >
                        {form.processing ? '...' : locale === 'ar' ? 'حفظ المنتج' : 'Save Product'}
                    </button>
                </div>

                {/* Stepper Navigation */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {steps.map((s) => {
                            const Icon = s.icon;
                            const active = step === s.num;
                            const completed = step > s.num;
                            return (
                                <button
                                    key={s.num}
                                    type="button"
                                    onClick={() => setStep(s.num)}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg text-start transition-colors ${
                                        active
                                            ? 'bg-teal-700 text-white shadow-sm'
                                            : completed
                                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                            active ? 'bg-white/20 text-white' : completed ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {completed ? <Check className="w-3.5 h-3.5" /> : s.num}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold truncate">{s.title}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Validation Errors Banner */}
                {Object.keys(form.errors).length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
                        <div className="font-semibold mb-1">{locale === 'ar' ? 'يرجى تصحيح الأخطاء التالية:' : 'Please fix the following errors:'}</div>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                            {Object.values(form.errors).map((err, i) => (
                                <li key={i}>{String(err)}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* STEP 1: BASIC INFO */}
                {step === 1 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                        <h2 className="font-semibold text-base">{steps[0].title}</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Name (EN) *</label>
                                <input
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Studio Wireless Headphones"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">الاسم (عربي)</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={form.data.name_ar}
                                    onChange={(e) => form.setData('name_ar', e.target.value)}
                                    placeholder="مثال: سماعات لاسلكية"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">SKU *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.data.sku}
                                        onChange={(e) => form.setData('sku', e.target.value)}
                                        placeholder="e.g. PRD-1024"
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={generateSku}
                                        className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50 shrink-0 inline-flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                                        <span>Auto</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Barcode</label>
                                <input
                                    type="text"
                                    value={form.data.barcode}
                                    onChange={(e) => form.setData('barcode', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Category</label>
                                <select
                                    value={form.data.category_id}
                                    onChange={(e) => form.setData('category_id', e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                                >
                                    <option value="">None</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{locale === 'ar' && c.name_ar ? c.name_ar : c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Brand</label>
                                <select
                                    value={form.data.brand_id}
                                    onChange={(e) => form.setData('brand_id', e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                                >
                                    <option value="">None</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>{locale === 'ar' && b.name_ar ? b.name_ar : b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">Visibility</label>
                                <select
                                    value={form.data.visibility}
                                    onChange={(e) => form.setData('visibility', e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                                >
                                    <option value="public">Public</option>
                                    <option value="catalog_only">Catalog Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1">Description (EN)</label>
                                <textarea
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">الوصف (عربي)</label>
                                <textarea
                                    rows={3}
                                    dir="rtl"
                                    value={form.data.description_ar}
                                    onChange={(e) => form.setData('description_ar', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                                />
                            </div>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={form.data.is_featured}
                                onChange={(e) => form.setData('is_featured', e.target.checked)}
                                className="rounded text-teal-600"
                            />
                            <span>{locale === 'ar' ? 'تمييز هذا المنتج في الصفحة الرئيسية' : 'Feature this product on homepage'}</span>
                        </label>
                    </div>
                )}

                {/* STEP 2: PRICING & INVENTORY */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                            <div>
                                <h2 className="font-semibold text-base">{locale === 'ar' ? 'تسعير المنتج' : 'Product Pricing'}</h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {locale === 'ar'
                                        ? 'أدخل السعر الأساسي فقط، وباقي الأسعار اختيارية تماماً يمكنك تركها فارغة.'
                                        : 'Enter the main price. All other price types are completely optional.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {form.data.prices
                                    .map((p: any, idx: number) => ({ p, idx }))
                                    .filter(({ p }: any) => p.slug === 'regular' || p.slug === 'sale')
                                    .map(({ p, idx }: any) => (
                                        <div key={p.price_type_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-800">
                                                    {locale === 'ar' && p.name_ar ? p.name_ar : p.name}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {p.slug === 'regular'
                                                        ? locale === 'ar' ? 'السعر العادي' : 'Main price'
                                                        : locale === 'ar' ? 'اختياري (عند وجود خصم)' : 'Optional discount'}
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={p.amount}
                                                onChange={(e) => {
                                                    const next = [...form.data.prices];
                                                    next[idx].amount = e.target.value;
                                                    form.setData('prices', next);
                                                }}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-base bg-white font-semibold"
                                            />
                                        </div>
                                    ))}
                            </div>

                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedPricing((v) => !v)}
                                    className="text-xs font-semibold text-teal-700 hover:underline"
                                >
                                    {showAdvancedPricing
                                        ? locale === 'ar' ? '− إخفاء الأسعار الإضافية (جملة / تجزئة / أعضاء)' : '− Hide additional pricing tiers'
                                        : locale === 'ar' ? '+ إضافة أسعار متقدمة اختيارية (سعر الجملة، التجزئة، الأعضاء، أو أقل كمية)' : '+ Add optional pricing tiers (Wholesale, Retail, Member, Min Qty)'}
                                </button>

                                {showAdvancedPricing && (
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {form.data.prices
                                            .map((p: any, idx: number) => ({ p, idx }))
                                            .filter(({ p }: any) => p.slug !== 'regular' && p.slug !== 'sale')
                                            .map(({ p, idx }: any) => (
                                                <div key={p.price_type_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                                    <div className="text-xs font-bold text-slate-700">
                                                        {locale === 'ar' && p.name_ar ? p.name_ar : p.name}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={locale === 'ar' ? 'اختياري' : 'Optional'}
                                                        value={p.amount}
                                                        onChange={(e) => {
                                                            const next = [...form.data.prices];
                                                            next[idx].amount = e.target.value;
                                                            form.setData('prices', next);
                                                        }}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-semibold"
                                                    />
                                                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                                                        <span>{locale === 'ar' ? 'تبدأ من كمية:' : 'Min Qty:'}</span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={p.min_quantity}
                                                            onChange={(e) => {
                                                                const next = [...form.data.prices];
                                                                next[idx].min_quantity = parseInt(e.target.value, 10) || 1;
                                                                form.setData('prices', next);
                                                            }}
                                                            className="w-20 px-2 py-1 rounded border border-slate-300 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                            <h2 className="font-semibold text-base">{locale === 'ar' ? 'إعدادات المخزون' : 'Inventory Settings'}</h2>
                            {form.data.has_variations && (
                                <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800">
                                    {locale === 'ar'
                                        ? 'بما أن المنتج يحتوي على متغيرات، سيتم حساب إجمالي المخزون تلقائياً من مخزون المتغيرات في الخطوة 4.'
                                        : 'Variations are enabled — total stock will be automatically calculated from your variation rows in Step 4.'}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Stock Quantity</label>
                                    <input
                                        type="number"
                                        disabled={form.data.has_variations}
                                        value={form.data.has_variations ? totalVariationStock : form.data.stock_quantity}
                                        onChange={(e) => form.setData('stock_quantity', parseInt(e.target.value, 10) || 0)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm disabled:bg-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Low Stock Alert Threshold</label>
                                    <input
                                        type="number"
                                        value={form.data.low_stock_threshold}
                                        onChange={(e) => form.setData('low_stock_threshold', parseInt(e.target.value, 10) || 0)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-1">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.data.track_inventory}
                                        onChange={(e) => form.setData('track_inventory', e.target.checked)}
                                    />
                                    <span>Track Inventory</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.data.allow_backorder}
                                        onChange={(e) => form.setData('allow_backorder', e.target.checked)}
                                    />
                                    <span>Allow Backorder</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: IMAGES & GALLERY */}
                {step === 3 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                        <h2 className="font-semibold text-base">{steps[2].title}</h2>

                        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-sm text-slate-600">
                            <Upload className="w-8 h-8 text-teal-700" />
                            <span className="font-medium">
                                {locale === 'ar' ? 'اضغط لاختيار الصور (يتم تحسينها تلقائياً إلى WebP)' : 'Click to upload images (auto-optimized to WebP + thumbnails)'}
                            </span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    form.setData('images', [...(form.data.images as File[]), ...files]);
                                }}
                            />
                        </label>

                        {imagePreviews.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-teal-700 mb-2">
                                    New Images Ready to Upload ({imagePreviews.length})
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {imagePreviews.map((item, idx) => (
                                        <div key={idx} className="relative rounded-lg border overflow-hidden">
                                            <img src={item.url} alt="" className="w-full h-32 object-cover" />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData(
                                                        'images',
                                                        (form.data.images as File[]).filter((_, i) => i !== idx)
                                                    )
                                                }
                                                className="absolute top-1.5 end-1.5 p-1 rounded-full bg-red-600 text-white"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {product?.images && product.images.length > 0 && (
                            <div>
                                <div className="text-xs font-semibold text-slate-500 mb-2">Uploaded Gallery</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {product.images.map((img) => (
                                        <div key={img.id} className="relative rounded-lg border overflow-hidden">
                                            <img src={`/storage/${img.thumbnail_path || img.path}`} alt="" className="w-full h-32 object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/60 flex items-center justify-between text-white text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => router.post(`/admin/products/${product.id}/images/${img.id}/main`)}
                                                    className={img.is_main ? 'text-amber-400' : 'text-white/80'}
                                                    title="Set as main"
                                                >
                                                    <Star className="w-4 h-4 fill-current" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => router.delete(`/admin/products/${product.id}/images/${img.id}`)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: VARIATIONS */}
                {step === 4 && (
                    <VariationsStep
                        hasVariations={form.data.has_variations}
                        onToggleVariations={(val) => form.setData('has_variations', val)}
                        productSku={form.data.sku}
                        defaultPrice={regularPrice}
                        attributes={attributes}
                        variations={form.data.variations}
                        onChangeVariations={(rows) => form.setData('variations', rows)}
                        variationImages={form.data.variation_images}
                        onVariationImageChange={(idx, file) => {
                            const next = { ...(form.data.variation_images as Record<number, File>) };
                            if (file) {
                                next[idx] = file;
                            } else {
                                delete next[idx];
                            }
                            form.setData('variation_images', next);
                        }}
                        onVariationRemove={(removedIdx) => {
                            const current = form.data.variation_images as Record<number, File>;
                            const reindexed: Record<number, File> = {};
                            Object.entries(current).forEach(([k, v]) => {
                                const i = Number(k);
                                if (i < removedIdx) reindexed[i] = v;
                                else if (i > removedIdx) reindexed[i - 1] = v;
                            });
                            form.setData('variation_images', reindexed);
                        }}
                        locale={locale}
                    />
                )}

                {/* STEP 5: REVIEW & SEO */}
                {step === 5 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                            <h2 className="font-semibold text-base">SEO Metadata</h2>
                            <div>
                                <label className="block text-xs font-semibold mb-1">SEO Title</label>
                                <input
                                    type="text"
                                    value={form.data.seo_title}
                                    onChange={(e) => form.setData('seo_title', e.target.value)}
                                    placeholder={form.data.name}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1">SEO Description</label>
                                <textarea
                                    rows={3}
                                    value={form.data.seo_description}
                                    onChange={(e) => form.setData('seo_description', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                            <h2 className="font-semibold text-base">{locale === 'ar' ? 'ملخص المنتج' : 'Product Summary'}</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Name</span>
                                    <span className="font-semibold">{form.data.name || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">SKU</span>
                                    <span className="font-mono">{form.data.sku || '—'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Regular Price</span>
                                    <span className="font-bold text-teal-700">{regularPrice ? `$${regularPrice}` : '—'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Total Stock</span>
                                    <span className="font-semibold">
                                        {form.data.has_variations ? totalVariationStock : form.data.stock_quantity}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Variations</span>
                                    <span className="font-semibold">
                                        {form.data.has_variations ? `${form.data.variations.length} option(s)` : 'Simple product'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() => submit('draft')}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50"
                                >
                                    {locale === 'ar' ? 'حفظ كمسودة' : 'Save as Draft'}
                                </button>
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() => submit('published')}
                                    className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
                                >
                                    {locale === 'ar' ? 'نشر المنتج الآن' : 'Publish Product'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Step Navigation */}
                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="button"
                        disabled={step === 1}
                        onClick={() => setStep((s) => Math.max(1, s - 1))}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium disabled:opacity-40"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'السابق' : 'Previous'}</span>
                    </button>

                    {step < 5 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => Math.min(5, s + 1))}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold"
                        >
                            <span>{locale === 'ar' ? 'التالي' : 'Next Step'}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
