import React, { useState } from 'react';
import { ImagePlus, Layers, Plus, Sparkles, Star, Trash2, X } from 'lucide-react';

export interface VariationRow {
    id?: number;
    name: string;
    sku: string;
    price: string;
    stock_quantity: number;
    status: 'active' | 'inactive';
    is_default: boolean;
    option_ids?: number[];
    existing_image?: string | null;
}

interface AttributeItem {
    id: number;
    name: string;
    options: Array<{ id: number; value: string; color_hex?: string | null }>;
}

interface VariationsStepProps {
    hasVariations: boolean;
    onToggleVariations: (val: boolean) => void;
    productSku: string;
    defaultPrice: string;
    attributes: AttributeItem[];
    variations: VariationRow[];
    onChangeVariations: (rows: VariationRow[]) => void;
    variationImages?: Record<number, File>;
    onVariationImageChange?: (index: number, file: File | null) => void;
    onVariationRemove?: (index: number) => void;
    locale: 'en' | 'ar';
}

export default function VariationsStep({
    hasVariations,
    onToggleVariations,
    productSku,
    defaultPrice,
    attributes: initialAttributes,
    variations,
    onChangeVariations,
    variationImages = {},
    onVariationImageChange,
    onVariationRemove,
    locale,
}: VariationsStepProps) {
    const [attributes, setAttributes] = useState<AttributeItem[]>(initialAttributes);
    const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrOptions, setNewAttrOptions] = useState('');
    const [creatingAttr, setCreatingAttr] = useState(false);

    const toggleOption = (attrId: number, optId: number) => {
        setSelectedOptions((prev) => {
            const current = prev[attrId] || [];
            const next = current.includes(optId) ? current.filter((id) => id !== optId) : [...current, optId];
            return { ...prev, [attrId]: next };
        });
    };

    const createQuickAttribute = async () => {
        const name = newAttrName.trim();
        const opts = newAttrOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        if (!name || opts.length === 0) return;

        setCreatingAttr(true);
        try {
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
            const res = await fetch('/admin/attributes/quick', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ name, options: opts }),
            });

            if (res.ok) {
                const json = await res.json();
                const created: AttributeItem = json.attribute;
                setAttributes((prev) => {
                    const exists = prev.some((a) => a.id === created.id);
                    return exists ? prev.map((a) => (a.id === created.id ? created : a)) : [...prev, created];
                });
                setSelectedOptions((prev) => ({
                    ...prev,
                    [created.id]: created.options.map((o) => o.id),
                }));
                setNewAttrName('');
                setNewAttrOptions('');
            }
        } finally {
            setCreatingAttr(false);
        }
    };

    const generateCombinations = () => {
        const groups = Object.entries(selectedOptions)
            .filter(([, ids]) => ids.length > 0)
            .map(([attrId, ids]) => {
                const attr = attributes.find((a) => a.id === Number(attrId));
                return ids
                    .map((id) => attr?.options.find((o) => o.id === id))
                    .filter((o): o is { id: number; value: string } => Boolean(o));
            })
            .filter((g) => g.length > 0);

        if (groups.length === 0) return;

        let combos: Array<Array<{ id: number; value: string }>> = [[]];
        for (const group of groups) {
            const next: Array<Array<{ id: number; value: string }>> = [];
            for (const c of combos) {
                for (const opt of group) {
                    next.push([...c, opt]);
                }
            }
            combos = next;
        }

        const existingKeys = new Set(variations.map((v) => (v.option_ids || []).slice().sort().join('-')));
        const baseSku = (productSku || 'PROD').toUpperCase();
        const generated: VariationRow[] = [...variations];

        combos.forEach((combo, idx) => {
            const optIds = combo.map((o) => o.id);
            const key = optIds.slice().sort().join('-');
            if (existingKeys.has(key)) return;

            const label = combo.map((o) => o.value).join(' / ');
            const suffix = combo
                .map((o) => o.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4))
                .join('-');

            generated.push({
                name: label,
                sku: `${baseSku}-${suffix || idx + 1}`,
                price: defaultPrice || '',
                stock_quantity: 10,
                status: 'active',
                is_default: generated.length === 0,
                option_ids: optIds,
            });
        });

        onToggleVariations(true);
        onChangeVariations(generated);
    };

    const addManualRow = () => {
        onToggleVariations(true);
        onChangeVariations([
            ...variations,
            {
                name: '',
                sku: `${(productSku || 'PROD').toUpperCase()}-V${variations.length + 1}`,
                price: defaultPrice || '',
                stock_quantity: 0,
                status: 'active',
                is_default: variations.length === 0,
            },
        ]);
    };

    const updateRow = (idx: number, patch: Partial<VariationRow>) => {
        const next = variations.map((row, i) => {
            if (patch.is_default) {
                return i === idx ? { ...row, ...patch, is_default: true } : { ...row, is_default: false };
            }
            return i === idx ? { ...row, ...patch } : row;
        });
        onChangeVariations(next);
    };

    const removeRow = (idx: number) => {
        onChangeVariations(variations.filter((_, i) => i !== idx));
        onVariationRemove?.(idx);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-base flex items-center gap-2">
                            <Layers className="w-5 h-5 text-teal-700" />
                            <span>{locale === 'ar' ? 'خيارات ومتغيرات المنتج' : 'Product Variations (Size, Color, etc.)'}</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {locale === 'ar'
                                ? 'فعّل هذا الخيار إذا كان للمنتج ألوان أو مقاسات مختلفة ولكل منها سعر أو مخزون مستقل.'
                                : 'Enable this if your product comes in multiple options with their own SKU, price, or stock.'}
                        </p>
                    </div>
                    <label className="inline-flex items-center gap-2.5 cursor-pointer px-4 py-2 rounded-lg border border-slate-200 bg-slate-50">
                        <input
                            type="checkbox"
                            checked={hasVariations}
                            onChange={(e) => onToggleVariations(e.target.checked)}
                            className="rounded text-teal-600"
                        />
                        <span className="text-sm font-semibold">
                            {locale === 'ar' ? 'تفعيل المتغيرات' : 'Enable Variations'}
                        </span>
                    </label>
                </div>
            </div>

            {hasVariations && (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">
                                {locale === 'ar' ? '1. اختر أو أنشئ الخصائص' : '1. Pick or Quick-Add Attributes'}
                            </h3>
                            <button
                                type="button"
                                onClick={generateCombinations}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'توليد المتغيرات تلقائياً' : 'Generate Combinations'}</span>
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                                {locale === 'ar' ? 'إضافة خاصية جديدة بسرعة (مثال: اللون ← أسود، أبيض)' : 'Quick-Add Attribute (e.g. Color → Black, White, Red)'}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder={locale === 'ar' ? 'اسم الخاصية (مثل: المقاس)' : 'Attribute name (e.g. Size)'}
                                    value={newAttrName}
                                    onChange={(e) => setNewAttrName(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white sm:w-48"
                                />
                                <input
                                    type="text"
                                    placeholder={locale === 'ar' ? 'القيم مفصولة بفاصلة: S, M, L' : 'Options comma-separated: S, M, L'}
                                    value={newAttrOptions}
                                    onChange={(e) => setNewAttrOptions(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white flex-1"
                                />
                                <button
                                    type="button"
                                    disabled={creatingAttr}
                                    onClick={createQuickAttribute}
                                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {creatingAttr ? '...' : locale === 'ar' ? '+ إضافة' : '+ Add Attribute'}
                                </button>
                            </div>
                        </div>

                        {attributes.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attributes.map((attr) => (
                                    <div key={attr.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="text-xs font-bold uppercase text-slate-500 mb-2">{attr.name}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {attr.options.map((opt) => {
                                                const active = (selectedOptions[attr.id] || []).includes(opt.id);
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => toggleOption(attr.id, opt.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                                            active
                                                                ? 'bg-teal-700 text-white border-teal-700'
                                                                : 'bg-white dark:bg-slate-800 border-slate-200 hover:border-teal-500'
                                                        }`}
                                                    >
                                                        {opt.value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">
                                {locale === 'ar' ? `2. جدول المتغيرات (${variations.length})` : `2. Variations Table (${variations.length})`}
                            </h3>
                            <button
                                type="button"
                                onClick={addManualRow}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{locale === 'ar' ? 'إضافة متغير يدوي' : 'Add Manual Row'}</span>
                            </button>
                        </div>

                        {variations.length === 0 ? (
                            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed text-sm text-slate-500">
                                {locale === 'ar'
                                    ? 'اختر الخيارات أعلاه واضغط "توليد المتغيرات" أو أضف متغيراً يدوياً.'
                                    : 'Select options above and click "Generate Combinations", or add a manual row.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                                        <tr>
                                            <th className="p-2.5 text-start">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                                            <th className="p-2.5 text-start">Option / Name</th>
                                            <th className="p-2.5 text-start">SKU</th>
                                            <th className="p-2.5 text-start">Price</th>
                                            <th className="p-2.5 text-start">Stock</th>
                                            <th className="p-2.5 text-center">Default</th>
                                            <th className="p-2.5 text-end">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {variations.map((v, idx) => {
                                            const pendingFile = variationImages[idx];
                                            const previewSrc = pendingFile
                                                ? URL.createObjectURL(pendingFile)
                                                : v.existing_image
                                                    ? `/storage/${v.existing_image}`
                                                    : null;

                                            return (
                                            <tr key={idx}>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <label className="relative w-11 h-11 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:border-teal-600 flex items-center justify-center overflow-hidden cursor-pointer shrink-0 group">
                                                            {previewSrc ? (
                                                                <img src={previewSrc} alt={v.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImagePlus className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0] ?? null;
                                                                    onVariationImageChange?.(idx, file);
                                                                }}
                                                            />
                                                        </label>
                                                        {!previewSrc && (
                                                            <span className="text-[10px] text-slate-400 leading-tight whitespace-nowrap">
                                                                {locale === 'ar' ? 'صورة الأساسي' : 'Base image'}
                                                            </span>
                                                        )}
                                                        {pendingFile && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onVariationImageChange?.(idx, null)}
                                                                className="p-0.5 rounded-full text-slate-400 hover:text-red-500"
                                                                title={locale === 'ar' ? 'إزالة' : 'Clear'}
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={v.name}
                                                        onChange={(e) => updateRow(idx, { name: e.target.value })}
                                                        placeholder="e.g. Black / L"
                                                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={v.sku}
                                                        onChange={(e) => updateRow(idx, { sku: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={defaultPrice || '0.00'}
                                                        value={v.price}
                                                        onChange={(e) => updateRow(idx, { price: e.target.value })}
                                                        className="w-24 px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        value={v.stock_quantity}
                                                        onChange={(e) => updateRow(idx, { stock_quantity: parseInt(e.target.value, 10) || 0 })}
                                                        className="w-20 px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRow(idx, { is_default: true })}
                                                        className={v.is_default ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}
                                                    >
                                                        <Star className="w-4 h-4 fill-current inline" />
                                                    </button>
                                                </td>
                                                <td className="p-2 text-end">
                                                    <button type="button" onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4 inline" />
                                                    </button>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
