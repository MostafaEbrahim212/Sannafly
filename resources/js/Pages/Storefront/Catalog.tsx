import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import StorefrontLayout from '@/Layouts/StorefrontLayout';
import SeoHead from '@/Components/SeoHead';
import ProductCard from '@/Components/Storefront/ProductCard';
import { useTranslation } from '@/lib/i18n';
import type { Brand, Category, Product } from '@/types';

interface CatalogProps {
    products: {
        data: Product[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    categories: Category[];
    brands: Brand[];
    attributes: Array<{ id: number; name: string; name_ar?: string | null; type: string; options: Array<{ id: number; value: string; value_ar?: string | null; color_hex?: string | null }> }>;
    priceBounds: { min: number; max: number };
    filters: Record<string, any>;
}

export default function Catalog({ products, categories, brands, attributes = [], filters }: CatalogProps) {
    const { t, localized, settings, locale } = useTranslation();

    const initialBrands = typeof filters?.brands === 'string'
        ? filters.brands.split(',').filter(Boolean)
        : typeof filters?.brand === 'string' && filters.brand
        ? [filters.brand]
        : [];
    const initialOptions = typeof filters?.options === 'string'
        ? filters.options.split(',').map(Number).filter(Boolean)
        : [];

    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [category, setCategory] = useState(typeof filters?.category === 'string' ? filters.category : '');
    const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
    const [selectedOptions, setSelectedOptions] = useState<number[]>(initialOptions);
    const [sort, setSort] = useState(typeof filters?.sort === 'string' ? filters.sort : '');
    const [minPrice, setMinPrice] = useState(typeof filters?.min_price === 'string' ? filters.min_price : '');
    const [maxPrice, setMaxPrice] = useState(typeof filters?.max_price === 'string' ? filters.max_price : '');
    const [inStock, setInStock] = useState(Boolean(filters?.in_stock));
    const [onSale, setOnSale] = useState(Boolean(filters?.on_sale));
    const [featured, setFeatured] = useState(Boolean(filters?.featured));
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        categories: true,
        brands: true,
        price: true,
        attributes: true,
        status: true,
    });

    const toggleSection = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

    const applyFilters = (overrides: Record<string, any> = {}) => {
        const nextBrands = overrides.brands !== undefined ? overrides.brands : selectedBrands;
        const nextOptions = overrides.options !== undefined ? overrides.options : selectedOptions;

        router.get(
            '/catalog',
            {
                search: (overrides.search !== undefined ? overrides.search : search) || undefined,
                category: (overrides.category !== undefined ? overrides.category : category) || undefined,
                brands: nextBrands.length > 0 ? nextBrands.join(',') : undefined,
                options: nextOptions.length > 0 ? nextOptions.join(',') : undefined,
                sort: (overrides.sort !== undefined ? overrides.sort : sort) || undefined,
                min_price: (overrides.min_price !== undefined ? overrides.min_price : minPrice) || undefined,
                max_price: (overrides.max_price !== undefined ? overrides.max_price : maxPrice) || undefined,
                in_stock: (overrides.in_stock !== undefined ? overrides.in_stock : inStock) ? 1 : undefined,
                on_sale: (overrides.on_sale !== undefined ? overrides.on_sale : onSale) ? 1 : undefined,
                featured: (overrides.featured !== undefined ? overrides.featured : featured) ? 1 : undefined,
            },
            { preserveState: true }
        );
    };

    const toggleBrand = (slug: string) => {
        const next = selectedBrands.includes(slug)
            ? selectedBrands.filter((b) => b !== slug)
            : [...selectedBrands, slug];
        setSelectedBrands(next);
        applyFilters({ brands: next });
    };

    const toggleOption = (id: number) => {
        const next = selectedOptions.includes(id)
            ? selectedOptions.filter((o) => o !== id)
            : [...selectedOptions, id];
        setSelectedOptions(next);
        applyFilters({ options: next });
    };

    const clearAll = () => {
        setSearch('');
        setCategory('');
        setSelectedBrands([]);
        setSelectedOptions([]);
        setSort('');
        setMinPrice('');
        setMaxPrice('');
        setInStock(false);
        setOnSale(false);
        setFeatured(false);
        router.get('/catalog');
    };

    // Build active chips
    const activeChips: Array<{ label: string; onRemove: () => void }> = [];
    if (search) activeChips.push({ label: `"${search}"`, onRemove: () => { setSearch(''); applyFilters({ search: '' }); } });
    if (category) {
        const catObj = categories.find((c) => c.slug === category);
        activeChips.push({
            label: localized(catObj?.name, catObj?.name_ar) || category,
            onRemove: () => { setCategory(''); applyFilters({ category: '' }); },
        });
    }
    selectedBrands.forEach((slug) => {
        const b = brands.find((x) => x.slug === slug);
        activeChips.push({ label: localized(b?.name, b?.name_ar) || slug, onRemove: () => toggleBrand(slug) });
    });
    selectedOptions.forEach((id) => {
        const opt = attributes.flatMap((a) => a.options).find((o) => o.id === id);
        if (opt) activeChips.push({ label: localized(opt.value, opt.value_ar), onRemove: () => toggleOption(id) });
    });
    if (minPrice || maxPrice) {
        activeChips.push({
            label: `${minPrice || 0} – ${maxPrice || '∞'}`,
            onRemove: () => { setMinPrice(''); setMaxPrice(''); applyFilters({ min_price: '', max_price: '' }); },
        });
    }
    if (inStock) activeChips.push({ label: t('in_stock'), onRemove: () => { setInStock(false); applyFilters({ in_stock: false }); } });
    if (onSale) activeChips.push({ label: locale === 'ar' ? 'عروض وخصومات' : 'On Sale', onRemove: () => { setOnSale(false); applyFilters({ on_sale: false }); } });
    if (featured) activeChips.push({ label: t('featured'), onRemove: () => { setFeatured(false); applyFilters({ featured: false }); } });

    const SectionHeader = ({ id, title }: { id: string; title: string }) => (
        <button
            type="button"
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3"
        >
            <span>{title}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openSections[id] ? '' : '-rotate-90'}`} />
        </button>
    );

    const filterContent = (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Filter className="w-4 h-4 text-teal-700" />
                    <span>{t('filters')}</span>
                </div>
                {activeChips.length > 0 && (
                    <button onClick={clearAll} className="text-xs font-semibold text-rose-600 hover:underline">
                        {locale === 'ar' ? 'مسح الكل' : 'Clear All'}
                    </button>
                )}
            </div>

            {/* Categories */}
            <div>
                <SectionHeader id="categories" title={t('categories')} />
                {openSections.categories && (
                    <div className="space-y-1 max-h-56 overflow-y-auto pe-1">
                        <button
                            type="button"
                            onClick={() => { setCategory(''); applyFilters({ category: '' }); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                category === '' ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>{t('all_categories')}</span>
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => { setCategory(c.slug); applyFilters({ category: c.slug }); }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                                    category === c.slug ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="truncate">{localized(c.name, c.name_ar)}</span>
                                <span className="text-[11px] text-slate-400">{c.products_count ?? 0}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Brands Multi-select */}
            {brands.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                    <SectionHeader id="brands" title={t('brands')} />
                    {openSections.brands && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
                            {brands.map((b) => {
                                const checked = selectedBrands.includes(b.slug);
                                return (
                                    <label key={b.id} className="flex items-center justify-between gap-2 text-xs cursor-pointer hover:text-teal-700">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleBrand(b.slug)}
                                                className="rounded border-slate-300 text-teal-600"
                                            />
                                            <span className="truncate font-medium">{localized(b.name, b.name_ar)}</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">{b.products_count ?? 0}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Price Range */}
            <div className="pt-4 border-t border-slate-100">
                <SectionHeader id="price" title={locale === 'ar' ? 'نطاق السعر' : 'Price Range'} />
                {openSections.price && (
                    <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: '< 100', min: '', max: '100' },
                                { label: '100 – 300', min: '100', max: '300' },
                                { label: '300+', min: '300', max: '' },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setMinPrice(preset.min);
                                        setMaxPrice(preset.max);
                                        applyFilters({ min_price: preset.min, max_price: preset.max });
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold hover:border-teal-500 hover:text-teal-700"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder={locale === 'ar' ? 'من' : 'Min'}
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                            />
                            <span className="text-slate-400">—</span>
                            <input
                                type="number"
                                placeholder={locale === 'ar' ? 'إلى' : 'Max'}
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                        >
                            {t('apply')}
                        </button>
                    </div>
                )}
            </div>

            {/* Attributes (Color / Size) */}
            {attributes.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                    <SectionHeader id="attributes" title={t('attributes')} />
                    {openSections.attributes &&
                        attributes.map((attr) => (
                            <div key={attr.id}>
                                <div className="text-xs font-semibold text-slate-700 mb-2">{localized(attr.name, attr.name_ar)}</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {attr.options.map((opt) => {
                                        const active = selectedOptions.includes(opt.id);
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleOption(opt.id)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                                                    active
                                                        ? 'bg-teal-700 text-white border-teal-700 font-semibold'
                                                        : 'bg-white border-slate-200 hover:border-teal-500 text-slate-700'
                                                }`}
                                            >
                                                {opt.color_hex && (
                                                    <span
                                                        className="w-3 h-3 rounded-full border border-slate-300"
                                                        style={{ backgroundColor: opt.color_hex }}
                                                    />
                                                )}
                                                <span>{localized(opt.value, opt.value_ar)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Availability & Offers */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <SectionHeader id="status" title={locale === 'ar' ? 'التوفر والعروض' : 'Availability & Offers'} />
                {openSections.status && (
                    <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={inStock}
                                onChange={(e) => { setInStock(e.target.checked); applyFilters({ in_stock: e.target.checked }); }}
                                className="rounded border-slate-300 text-teal-600"
                            />
                            <span>{t('in_stock')}</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={onSale}
                                onChange={(e) => { setOnSale(e.target.checked); applyFilters({ on_sale: e.target.checked }); }}
                                className="rounded border-slate-300 text-teal-600"
                            />
                            <span>{locale === 'ar' ? 'عروض وخصومات' : 'On Sale'}</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={featured}
                                onChange={(e) => { setFeatured(e.target.checked); applyFilters({ featured: e.target.checked }); }}
                                className="rounded border-slate-300 text-teal-600"
                            />
                            <span>{t('featured')}</span>
                        </label>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <StorefrontLayout>
            <SeoHead
                title={
                    category
                        ? `${t('catalog')} - ${localized(
                              categories.find((c) => c.slug === category)?.name || category,
                              categories.find((c) => c.slug === category)?.name_ar
                          )}`
                        : search
                        ? `${t('catalog')} - ${search}`
                        : t('catalog')
                }
                description={localized(settings.meta_description || settings.site_description, settings.site_description_ar)}
                noIndex={Boolean(search)}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: t('catalog'),
                    numberOfItems: products.total,
                }}
            />

            {/* Header Banner */}
            <div className="bg-gradient-to-b from-teal-50/70 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200/70 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
                    <div>
                        <div className="text-xs text-slate-400 mb-1">
                            <Link href="/" className="hover:text-teal-700 dark:hover:text-teal-400">{t('home')}</Link> / <span>{t('catalog')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('catalog')}</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 text-teal-800 dark:text-teal-300 text-xs font-bold">
                                {products.total} {t('products')}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setMobileFiltersOpen(true)}
                            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>{t('filters')}</span>
                        </button>

                        <div className="relative flex-1 sm:flex-initial">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder={t('search_placeholder')}
                                className="ps-4 pe-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm w-full sm:w-64 focus:outline-none focus:border-teal-500"
                            />
                            <button onClick={() => applyFilters()} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                                <Search className="w-4 h-4" />
                            </button>
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium"
                        >
                            <option value="">{t('featured')}</option>
                            <option value="name_asc">{t('name_az')}</option>
                            <option value="name_desc">{t('name_za')}</option>
                            <option value="price_asc">{t('price_low_high')}</option>
                            <option value="price_desc">{t('price_high_low')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit sticky top-24">
                        {filterContent}
                    </aside>

                    {mobileFiltersOpen && (
                        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden flex justify-end">
                            <div className="w-80 max-w-full bg-white h-full p-6 overflow-y-auto">
                                <div className="flex justify-end mb-4">
                                    <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-lg bg-slate-100">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {filterContent}
                            </div>
                        </div>
                    )}

                    <div className="lg:col-span-3 space-y-5">
                        {/* Active Filter Chips Bar */}
                        {activeChips.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80">
                                {activeChips.map((chip, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={chip.onRemove}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold hover:bg-teal-100"
                                    >
                                        <span>{chip.label}</span>
                                        <X className="w-3 h-3" />
                                    </button>
                                ))}
                                <button onClick={clearAll} className="ms-auto text-xs font-semibold text-rose-600 hover:underline px-2">
                                    {locale === 'ar' ? 'مسح الكل' : 'Clear All'}
                                </button>
                            </div>
                        )}

                        {products.data.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 text-slate-500">
                                <p className="font-medium">{t('no_products_found')}</p>
                                {activeChips.length > 0 && (
                                    <button onClick={clearAll} className="mt-3 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold">
                                        {locale === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.data.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {products.links.length > 3 && (
                            <div className="pt-6 flex flex-wrap gap-1.5 justify-center">
                                {products.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                                            link.active
                                                ? 'bg-teal-700 text-white border-teal-700'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
