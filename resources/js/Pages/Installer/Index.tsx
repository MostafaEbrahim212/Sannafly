import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Database,
    Globe,
    Lock,
    Rocket,
    Server,
    ShieldCheck,
    Sparkles,
    UserCheck,
    XCircle,
} from 'lucide-react';

interface RequirementItem {
    name: string;
    category: string;
    status: 'passed' | 'failed' | 'warning';
    current: string;
    required: string;
    fix: string;
}

interface Props {
    product: { name: string; version: string };
    requirements: { can_continue: boolean; items: RequirementItem[] };
    defaults: {
        app_name: string;
        app_url: string;
        app_env: 'production' | 'local';
        locale: 'en' | 'ar';
        timezone: string;
        currency: string;
        db_host: string;
        db_port: number;
        db_database: string;
        db_username: string;
    };
}

const STEPS = [
    { id: 1, title: 'Welcome', icon: Sparkles },
    { id: 2, title: 'Requirements', icon: Server },
    { id: 3, title: 'Database', icon: Database },
    { id: 4, title: 'Application', icon: Globe },
    { id: 5, title: 'Install', icon: Rocket },
    { id: 6, title: 'Owner', icon: UserCheck },
    { id: 7, title: 'Finish', icon: CheckCircle2 },
];

export default function InstallerIndex({ product, requirements, defaults }: Props) {
    const [step, setStep] = useState(1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dbTested, setDbTested] = useState(false);
    const [dbMessage, setDbMessage] = useState<string | null>(null);
    const [installLog, setInstallLog] = useState<string[]>([]);
    const [finishUrls, setFinishUrls] = useState<{ app_url: string; admin_url: string }>({
        app_url: defaults.app_url,
        admin_url: `${defaults.app_url}/admin/login`,
    });

    const [form, setForm] = useState({
        db_host: defaults.db_host,
        db_port: defaults.db_port,
        db_database: defaults.db_database,
        db_username: defaults.db_username,
        db_password: '',
        app_name: defaults.app_name,
        app_url: defaults.app_url,
        app_env: defaults.app_env,
        locale: defaults.locale,
        timezone: defaults.timezone,
        currency: defaults.currency,
        seed_demo: false,
        owner_name: '',
        owner_email: '',
        owner_password: '',
        owner_password_confirmation: '',
    });

    const csrf = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';

    const postJson = async (url: string, body: Record<string, unknown>) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrf(),
            },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || Object.values(data.errors || {}).flat().join(' ') || 'Request failed');
        }
        return data;
    };

    const handleTestDb = async () => {
        setBusy(true);
        setError(null);
        setDbMessage(null);
        try {
            const res = await postJson('/install/test-db', {
                db_host: form.db_host,
                db_port: form.db_port,
                db_database: form.db_database,
                db_username: form.db_username,
                db_password: form.db_password,
            });
            setDbTested(true);
            setDbMessage(res.message);
        } catch (e: any) {
            setDbTested(false);
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleSaveEnv = async () => {
        setBusy(true);
        setError(null);
        try {
            await postJson('/install/save-env', form);
            setStep(5);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleRunInstall = async () => {
        setBusy(true);
        setError(null);
        try {
            const res = await postJson('/install/run', {
                app_name: form.app_name,
                locale: form.locale,
                timezone: form.timezone,
                currency: form.currency,
                seed_demo: form.seed_demo,
            });
            setInstallLog(res.steps || []);
            setStep(6);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleCreateOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const res = await postJson('/install/owner', {
                name: form.owner_name,
                email: form.owner_email,
                password: form.owner_password,
                password_confirmation: form.owner_password_confirmation,
            });
            setFinishUrls({ app_url: res.app_url, admin_url: res.admin_url });
            setStep(7);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
            <Head title={`Install — ${product.name}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-800 text-teal-300 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {product.name} • v{product.version}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Web Installation Wizard</h1>
                </div>

                {/* Progress Bar */}
                <div className="grid grid-cols-7 gap-1.5 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                    {STEPS.map((s) => {
                        const Icon = s.icon;
                        const active = step === s.id;
                        const done = step > s.id;
                        return (
                            <div
                                key={s.id}
                                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[11px] font-semibold transition-colors ${
                                    active
                                        ? 'bg-teal-600 text-white'
                                        : done
                                          ? 'bg-emerald-950/60 text-emerald-300'
                                          : 'text-slate-500'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline truncate">{s.title}</span>
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start gap-2">
                        <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Welcome to {product.name}</h2>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                This guided wizard checks your hosting environment, connects your MySQL/MariaDB database,
                                configures your store settings, runs database migrations, and creates your Owner account —
                                no SSH or terminal required.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                                    <div className="font-bold text-teal-300 mb-1">1. Server Check</div>
                                    <p className="text-slate-400">Verifies PHP 8.3+, extensions, and folder permissions.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                                    <div className="font-bold text-teal-300 mb-1">2. Database & App</div>
                                    <p className="text-slate-400">Safely writes .env with automatic backup.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                                    <div className="font-bold text-teal-300 mb-1">3. Locked Security</div>
                                    <p className="text-slate-400">Creates your Owner account and locks /install.</p>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold"
                                >
                                    Check Server Requirements →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Server Requirements</h2>
                            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                                {requirements.items.map((item) => (
                                    <div key={item.name} className="p-3.5 flex items-center justify-between gap-4 text-xs bg-slate-900/60">
                                        <div>
                                            <div className="font-semibold text-slate-200">{item.name}</div>
                                            {item.status !== 'passed' && (
                                                <div className="text-amber-300/90 mt-0.5">{item.fix}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-mono text-slate-400">{item.current}</span>
                                            {item.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                            {item.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                                            {item.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between pt-2">
                                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold">
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    disabled={!requirements.can_continue}
                                    onClick={() => setStep(3)}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-bold"
                                >
                                    Continue to Database →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Database Configuration</h2>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Database Host</label>
                                    <input
                                        type="text"
                                        value={form.db_host}
                                        onChange={(e) => {
                                            setDbTested(false);
                                            setForm({ ...form, db_host: e.target.value });
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Port</label>
                                    <input
                                        type="number"
                                        value={form.db_port}
                                        onChange={(e) => {
                                            setDbTested(false);
                                            setForm({ ...form, db_port: Number(e.target.value) });
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Database Name</label>
                                    <input
                                        type="text"
                                        value={form.db_database}
                                        onChange={(e) => {
                                            setDbTested(false);
                                            setForm({ ...form, db_database: e.target.value });
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Database Username</label>
                                    <input
                                        type="text"
                                        value={form.db_username}
                                        onChange={(e) => {
                                            setDbTested(false);
                                            setForm({ ...form, db_username: e.target.value });
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs text-slate-400 mb-1">Database Password</label>
                                    <input
                                        type="password"
                                        value={form.db_password}
                                        onChange={(e) => {
                                            setDbTested(false);
                                            setForm({ ...form, db_password: e.target.value });
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                            </div>

                            {dbMessage && (
                                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                                    {dbMessage}
                                </div>
                            )}

                            <div className="flex flex-wrap justify-between gap-2 pt-2">
                                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold">
                                    ← Back
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={handleTestDb}
                                        className="px-4 py-2.5 rounded-xl border border-teal-600 text-teal-300 text-xs font-bold hover:bg-teal-950/50"
                                    >
                                        {busy ? 'Testing...' : 'Test Connection'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!dbTested}
                                        onClick={() => setStep(4)}
                                        className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-bold"
                                    >
                                        Next: App Settings →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Application Configuration</h2>
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Store / App Name</label>
                                    <input
                                        type="text"
                                        value={form.app_name}
                                        onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Application URL</label>
                                    <input
                                        type="url"
                                        value={form.app_url}
                                        onChange={(e) => setForm({ ...form, app_url: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Environment</label>
                                    <select
                                        value={form.app_env}
                                        onChange={(e) => setForm({ ...form, app_env: e.target.value as 'production' | 'local' })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    >
                                        <option value="production">Production (Recommended)</option>
                                        <option value="local">Local / Staging</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Default Language</label>
                                    <select
                                        value={form.locale}
                                        onChange={(e) => setForm({ ...form, locale: e.target.value as 'en' | 'ar' })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    >
                                        <option value="en">English (LTR)</option>
                                        <option value="ar">العربية (RTL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Default Currency</label>
                                    <select
                                        value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    >
                                        <option value="EGP">EGP — Egyptian Pound</option>
                                        <option value="SAR">SAR — Saudi Riyal</option>
                                        <option value="AED">AED — UAE Dirham</option>
                                        <option value="USD">USD — US Dollar</option>
                                        <option value="EUR">EUR — Euro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Timezone</label>
                                    <input
                                        type="text"
                                        value={form.timezone}
                                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between pt-2">
                                <button type="button" onClick={() => setStep(3)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold">
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleSaveEnv}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold"
                                >
                                    {busy ? 'Saving .env...' : 'Save & Continue →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Run Database & System Installation</h2>
                            <p className="text-sm text-slate-400">
                                Ready to create all database tables, essential RBAC roles & permissions, payment gateway definitions, and default store settings.
                            </p>
                            <label className="flex items-center gap-2.5 p-4 rounded-2xl bg-slate-800/70 border border-slate-700 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.seed_demo}
                                    onChange={(e) => setForm({ ...form, seed_demo: e.target.checked })}
                                />
                                <span>Install optional Demo Catalog (sample categories, brands, and products)</span>
                            </label>
                            <div className="flex justify-between pt-2">
                                <button type="button" onClick={() => setStep(4)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold">
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleRunInstall}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold"
                                >
                                    {busy ? 'Installing...' : 'Run Installation Now →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <form onSubmit={handleCreateOwner} className="space-y-4">
                            <h2 className="text-xl font-bold">Create Owner (Super Admin) Account</h2>
                            {installLog.length > 0 && (
                                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-1">
                                    {installLog.map((line, i) => (
                                        <div key={i}>✓ {line}</div>
                                    ))}
                                </div>
                            )}
                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.owner_name}
                                        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={form.owner_email}
                                        onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Strong Password (8+ chars, mixed case + number)</label>
                                    <input
                                        type="password"
                                        required
                                        value={form.owner_password}
                                        onChange={(e) => setForm({ ...form, owner_password: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={form.owner_password_confirmation}
                                        onChange={(e) => setForm({ ...form, owner_password_confirmation: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold"
                                >
                                    {busy ? 'Creating Owner...' : 'Complete Installation →'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 7 && (
                        <div className="text-center space-y-5 py-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-950/70 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                                <Lock className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-extrabold">Installation Complete & Locked!</h2>
                            <p className="text-sm text-slate-400 max-w-lg mx-auto">
                                {product.name} v{product.version} is now installed and secured. The installer routes are automatically locked.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3 pt-2">
                                <a
                                    href={finishUrls.app_url}
                                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold hover:bg-slate-800"
                                >
                                    Visit Storefront
                                </a>
                                <a
                                    href={finishUrls.admin_url}
                                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold"
                                >
                                    Open Admin Dashboard →
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
