import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckSquare, Lock, Plus, Shield, Trash2, Users } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/lib/i18n';

export default function RolesIndex({ roles, permissions }: { roles: any[]; permissions: any[] }) {
    const { t, locale } = useTranslation();
    const [selectedRoleId, setSelectedRoleId] = useState<number>(roles[0]?.id || 0);
    const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
    const createForm = useForm({ name: '', description: '', permission_ids: [] as number[] });

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, any[]> = {};
        permissions.forEach((p) => {
            const grp = p.group || 'general';
            if (!groups[grp]) groups[grp] = [];
            groups[grp].push(p);
        });
        return groups;
    }, [permissions]);

    const updateRolePerms = (nextIds: number[]) => {
        if (!selectedRole || selectedRole.slug === 'super-admin') return;
        router.put(
            `/admin/roles/${selectedRole.id}`,
            {
                name: selectedRole.name,
                description: selectedRole.description,
                permission_ids: nextIds,
            },
            { preserveScroll: true }
        );
    };

    const togglePerm = (permId: number) => {
        if (!selectedRole || selectedRole.slug === 'super-admin') return;
        const currentIds: number[] = selectedRole.permissions.map((p: any) => p.id);
        const nextIds = currentIds.includes(permId)
            ? currentIds.filter((id) => id !== permId)
            : [...currentIds, permId];
        updateRolePerms(nextIds);
    };

    const toggleGroup = (groupPerms: any[]) => {
        if (!selectedRole || selectedRole.slug === 'super-admin') return;
        const currentIds: number[] = selectedRole.permissions.map((p: any) => p.id);
        const groupIds = groupPerms.map((p) => p.id);
        const allSelected = groupIds.every((id) => currentIds.includes(id));
        const nextIds = allSelected
            ? currentIds.filter((id) => !groupIds.includes(id))
            : Array.from(new Set([...currentIds, ...groupIds]));
        updateRolePerms(nextIds);
    };

    return (
        <AdminLayout title={t('roles')}>
            <Head title={t('roles')} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Create Role + Role List */}
                <div className="lg:col-span-4 space-y-5">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createForm.post('/admin/roles', { onSuccess: () => createForm.reset() });
                        }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs"
                    >
                        <h2 className="font-bold text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4 text-teal-600" />
                            <span>{t('create_custom_role')}</span>
                        </h2>
                        <input
                            type="text"
                            placeholder={t('role_name')}
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                            required
                        />
                        <input
                            type="text"
                            placeholder={locale === 'ar' ? 'وصف مختصر (اختياري)' : 'Short description (optional)'}
                            value={createForm.data.description}
                            onChange={(e) => createForm.setData('description', e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs"
                        >
                            {t('create')}
                        </button>
                    </form>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
                        {roles.map((r) => {
                            const active = selectedRole?.id === r.id;
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedRoleId(r.id)}
                                    className={`p-4 cursor-pointer flex items-center justify-between transition-colors ${
                                        active ? 'bg-teal-50/80 dark:bg-teal-950/40 border-s-4 border-teal-600' : 'hover:bg-slate-50/70'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Shield className={`w-4 h-4 ${active ? 'text-teal-700' : 'text-slate-400'}`} />
                                            <span className={`font-bold text-sm ${active ? 'text-teal-900 dark:text-teal-300' : ''}`}>
                                                {r.name}
                                            </span>
                                            {r.is_system && <Lock className="w-3 h-3 text-slate-400" />}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                            <Users className="w-3 h-3" />
                                            <span>{r.users_count} {t('users')}</span>
                                        </div>
                                    </div>
                                    {!r.is_system && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete this role?')) router.delete(`/admin/roles/${r.id}`);
                                            }}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Grouped Permissions Matrix */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                    {selectedRole && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className="font-bold text-lg">{selectedRole.name} — {t('role_permissions')}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {selectedRole.slug === 'super-admin'
                                            ? locale === 'ar'
                                                ? 'يمتلك المدير العام كافة الصلاحيات تلقائياً.'
                                                : 'Super Admin automatically has all system permissions.'
                                            : locale === 'ar'
                                            ? 'اضغط على أي صلاحية لتفعيلها أو تعطيلها فوراً.'
                                            : 'Click any permission to toggle access immediately.'}
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold">
                                    {selectedRole.slug === 'super-admin' ? permissions.length : selectedRole.permissions?.length || 0} / {permissions.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(groupedPermissions).map(([groupName, groupPerms]) => {
                                    const currentIds: number[] = selectedRole.permissions?.map((p: any) => p.id) || [];
                                    const allChecked = selectedRole.slug === 'super-admin' || groupPerms.every((p) => currentIds.includes(p.id));
                                    return (
                                        <div key={groupName} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-800/20">
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
                                                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{groupName}</span>
                                                {selectedRole.slug !== 'super-admin' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(groupPerms)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                                                    >
                                                        <CheckSquare className="w-3 h-3" />
                                                        <span>{allChecked ? (locale === 'ar' ? 'إلغاء الكل' : 'None') : (locale === 'ar' ? 'تحديد الكل' : 'All')}</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {groupPerms.map((perm) => {
                                                    const checked = selectedRole.slug === 'super-admin' || currentIds.includes(perm.id);
                                                    return (
                                                        <label
                                                            key={perm.id}
                                                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs transition-colors ${
                                                                checked
                                                                    ? 'bg-white dark:bg-slate-900 border-teal-200'
                                                                    : 'bg-transparent border-transparent hover:bg-white/70'
                                                            } ${selectedRole.slug === 'super-admin' ? 'opacity-75' : 'cursor-pointer'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                disabled={selectedRole.slug === 'super-admin'}
                                                                onChange={() => togglePerm(perm.id)}
                                                                className="rounded text-teal-600"
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-slate-800 dark:text-slate-200">{perm.name}</div>
                                                                <div className="text-[10px] font-mono text-slate-400">{perm.slug}</div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
