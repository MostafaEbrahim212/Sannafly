import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import React from 'react';
import { expect, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

vi.mock('@inertiajs/react', () => ({
    Head: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
        React.createElement('a', { href, ...props }, children),
    usePage: () => ({
        props: {
            locale: 'en',
            dir: 'ltr',
            auth: { user: null, customer: null },
            settings: {
                site_name: 'Sannafly',
                site_name_ar: 'صنّفلي',
                currency: 'EGP',
                currency_symbol: 'ج.م',
                module_ecommerce: true,
                module_cart: true,
                module_checkout: true,
            },
            flash: {},
        },
    }),
    useForm: (initial: Record<string, unknown>) => ({
        data: initial,
        setData: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    }),
    router: {
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
    },
}));
