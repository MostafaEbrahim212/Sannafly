import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Sannafly';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: async (name) => {
        const pages = import.meta.glob<{ default: any }>('./Pages/**/*.tsx');
        const loader = pages[`./Pages/${name}.tsx`];
        if (!loader) {
            throw new Error(`Page not found: ./Pages/${name}.tsx`);
        }
        const mod = await loader();
        return mod.default;
    },
    setup({ el, App, props }: any) {
        if (el) {
            createRoot(el).render(<App {...props} />);
        }
    },
    progress: {
        color: '#0A5C57',
    },
});
