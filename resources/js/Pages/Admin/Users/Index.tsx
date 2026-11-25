import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, RotateCcw, Search, Trash2, UserPlus } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function UsersIndex({ users, roles, filters }: { users: any; roles: any[]; filters?: Record<string, any> }) {
    const { t, can, locale } = useTranslation();
    const [editing, setEditing] = useState<any | null>(null);
    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [statusFilter, setStatusFilter] = useState(typeof filters?.status === 'string' ? filters.status : '');

    const form = useForm({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        password: '',
        role_ids: [] as number[],
    });

    const applyFilter = (overrides: Record<string, any> = {}) => {
        router.get('/admin/users', { search, status: statusFilter, ...overrides }, { preserveState: true });
    };

    const startEdit = (u: any) => {
        setEditing(u);
        form.setData({
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            status: u.status,
            password: '',
            role_ids: u.roles?.map((r: any) => r.id) || [],
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/users/${editing.id}`, {
                onSuccess: () => {
                    setEditing(null);
                    form.reset();
                },
            });
        } else {
            form.post('/admin/users', { onSuccess: () => form.reset() });
        }
    };

    const toggleRole = (id: number) => {
        const next = form.data.role_ids.includes(id)
            ? form.data.role_ids.filter((r) => r !== id)
            : [...form.data.role_ids, id];
        form.setData('role_ids', next);
    };

    return (
        <AdminLayout title={t('users')}>
            <Head title={t('users')} />

            {/* Top Filter & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                            placeholder={locale === 'ar' ? 'ابحث بالاسم أو البريد أو الهاتف...' : 'Search name, email, phone...'}
                            className="ps-3.5 pe-9 py-2 rounded-xl border border-slate-300 bg-white text-sm w-64"
                        />
                        <button onClick={() => applyFilter()} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilter({ status: e.target.value });
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                    >
                        <option value="">{t('all_statuses')}</option>
                        <option value="active">{t('active')}</option>
                        <option value="inactive">{t('inactive')}</option>
                        <option value="suspended">{t('suspended')}</option>
                        <option value="deleted">{t('deleted')}</option>
                    </select>
                </div>

                <a
                    href="/admin/users/export"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold hover:bg-slate-50 shadow-2xs"
                >
                    <Download className="w-4 h-4 text-teal-700" />
                    <span>{t('export_users_csv')}</span>
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {(can('users.create') || editing) && (
                    <form onSubmit={submit} className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 h-fit shadow-xs">
                        <h2 className="font-bold text-sm flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-teal-600" />
                            <span>{editing ? `${t('edit_user')}: ${editing.name}` : t('create_user')}</span>
                        </h2>
                        <input
                            type="text"
                            placeholder={t('full_name')}
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        <input
                            type="email"
                            placeholder={t('email')}
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        <input
                            type="text"
                            placeholder={t('phone')}
                            value={form.data.phone}
                            onChange={(e) => form.setData('phone', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                        <select
                            value={form.data.status}
                            onChange={(e) => form.setData('status', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                        >
                            <option value="active">{t('active')}</option>
                            <option value="inactive">{t('inactive')}</option>
                            <option value="suspended">{t('suspended')}</option>
                        </select>
                        <input
                            type="password"
                            placeholder={editing ? t('password_optional') : t('password_requirements')}
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                            required={!editing}
                        />
                        {form.errors.password && <p className="text-xs text-red-600">{form.errors.password}</p>}

                        <div>
                            <div className="text-xs font-bold text-slate-600 mb-2">{t('roles_label')}</div>
                            <div className="flex flex-wrap gap-1.5">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => toggleRole(r.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                            form.data.role_ids.includes(r.id)
                                                ? 'bg-teal-700 text-white border-teal-700'
                                                : 'bg-white border-slate-200 hover:border-teal-500'
                                        }`}
                                    >
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" disabled={form.processing} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                                {editing ? t('save') : t('create')}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(null);
                                        form.reset();
                                    }}
                                    className="px-4 py-2.5 rounded-xl border text-xs font-semibold"
                                >
                                    {t('cancel')}
                                </button>
                            )}
                        </div>
                    </form>
                )}

                <div className={`${can('users.create') || editing ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs`}>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b">
                            <tr>
                                <th className="p-3.5 text-start">{t('user')}</th>
                                <th className="p-3.5 text-start">{t('roles_label')}</th>
                                <th className="p-3.5 text-start">{t('status')}</th>
                                <th className="p-3.5 text-end">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.data.map((u: any) => (
                                <tr key={u.id} className="hover:bg-slate-50/60">
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{u.name}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex flex-wrap gap-1">
                                            {u.roles?.map((r: any) => (
                                                <span key={r.id} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                                    {r.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.status === 'active' && !u.deleted_at ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' && !u.deleted_at ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {u.deleted_at ? t('deleted') : t(u.status, u.status)}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-end space-x-2">
                                        {u.deleted_at ? (
                                            <button onClick={() => router.post(`/admin/users/${u.id}/restore`)} className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50">
                                                <RotateCcw className="w-4 h-4 inline" />
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(u)} className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100">
                                                    {t('edit')}
                                                </button>
                                                <button onClick={() => confirm('Deactivate user?') && router.delete(`/admin/users/${u.id}`)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4 inline" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
