import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, Truck } from 'lucide-react';
import BarcodeSvg from '@/Components/BarcodeSvg';
import { useTranslation } from '@/lib/i18n';

export default function ShippingLabel({ order }: { order: any }) {
    const { formatPrice, locale } = useTranslation();
    const addr = order.shipping_address || {};
    const isCod = order.payment_status !== 'paid';

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
            <Head title={`Shipping Label - ${order.order_number}`} />

            <div className="max-w-lg mx-auto mb-4 flex items-center justify-between print:hidden">
                <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'رجوع للطلب' : 'Back to Order'}</span>
                </Link>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                    <Printer className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'طباعة البوليصة' : 'Print Label'}</span>
                </button>
            </div>

            <div className="max-w-lg mx-auto bg-white border-2 border-slate-900 rounded-xl p-6 space-y-4 print:border-2 print:rounded-none print:shadow-none">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-2">
                        <Truck className="w-6 h-6" />
                        <div>
                            <div className="font-extrabold text-base tracking-tight">SANNAFLY EXPRESS</div>
                            <div className="text-[11px] text-slate-500">{order.shipping_carrier || 'Standard Courier'}</div>
                        </div>
                    </div>
                    <div className="text-end">
                        <div className="text-[10px] uppercase text-slate-500">Order #</div>
                        <div className="font-mono font-extrabold text-sm">{order.order_number}</div>
                    </div>
                </div>

                {order.tracking_number ? (
                    <div className="bg-slate-50 border border-slate-300 text-center py-2.5 px-3 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-500">AWB Tracking Barcode</div>
                        <BarcodeSvg value={order.tracking_number} height={42} />
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 text-center py-2 px-3 rounded-lg">
                        <BarcodeSvg value={order.order_number} height={38} />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-3">
                    <div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold">{locale === 'ar' ? 'المستلم' : 'Recipient'}</div>
                        <div className="font-bold text-sm mt-0.5">{order.customer_name}</div>
                        <div className="font-mono font-semibold mt-0.5">{order.customer_phone}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold">{locale === 'ar' ? 'المحافظة' : 'Governorate'}</div>
                        <div className="font-extrabold text-sm mt-0.5">{addr.city || '-'}</div>
                        {addr.area && <div className="text-slate-600">{addr.area}</div>}
                    </div>
                </div>

                <div className="text-xs border-b border-slate-200 pb-3">
                    <div className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">{locale === 'ar' ? 'العنوان بالتفصيل' : 'Delivery Address'}</div>
                    <div className="font-medium">
                        {addr.street}
                        {addr.building ? `, Bldg ${addr.building}` : ''}
                        {addr.floor ? `, Floor ${addr.floor}` : ''}
                        {addr.apartment ? `, Apt ${addr.apartment}` : ''}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border-b border-slate-200 pb-3">
                    <div className="p-2 bg-slate-50 rounded">
                        <div className="text-[10px] text-slate-400 font-bold">{locale === 'ar' ? 'القطع' : 'Items'}</div>
                        <div className="font-extrabold text-sm">{(order.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)}</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                        <div className="text-[10px] text-slate-400 font-bold">{locale === 'ar' ? 'الوزن' : 'Weight'}</div>
                        <div className="font-extrabold text-sm">{Number(order.total_weight || 0).toFixed(2)} kg</div>
                    </div>
                    <div className={`p-2 rounded ${isCod ? 'bg-amber-50 border border-amber-300' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <div className="text-[10px] font-bold">{isCod ? 'COD' : 'PAID'}</div>
                        <div className="font-extrabold text-sm">{isCod ? formatPrice(order.grand_total) : '0.00'}</div>
                    </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                    <div className="font-bold text-slate-700">{locale === 'ar' ? 'المحتويات:' : 'Contents:'}</div>
                    {(order.items || []).map((item: any) => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.quantity}× {item.product_name}</span>
                            <span className="font-mono">{item.sku}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
