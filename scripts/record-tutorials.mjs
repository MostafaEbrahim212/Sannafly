import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.DEMO_BASE_URL || 'http://127.0.0.1:8099';
const OUT_DIR = path.resolve('public/docs/videos');
const TMP_DIR = path.resolve('storage/app/tmp-videos');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

const RECIPES = {
    'vid-01': {
        filename: 'vid-01-intro.webm',
        auth: false,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/product`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.mouse.wheel(0, 500);
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-02': {
        filename: 'vid-02-dashboard.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 350);
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/notifications`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-03': {
        filename: 'vid-03-settings.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 450);
            await page.waitForTimeout(900);
        },
    },
    'vid-04': {
        filename: 'vid-04-products.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/products/create`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
        },
    },
    'vid-05': {
        filename: 'vid-05-edit-product.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/products/1/edit`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 350);
            await page.waitForTimeout(900);
        },
    },
    'vid-06': {
        filename: 'vid-06-attributes.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/attributes`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(900);
        },
    },
    'vid-07': {
        filename: 'vid-07-inventory.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(900);
        },
    },
    'vid-08': {
        filename: 'vid-08-categories-brands.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/brands`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-09': {
        filename: 'vid-09-storefront-catalog.webm',
        auth: false,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 450);
            await page.waitForTimeout(900);
        },
    },
    'vid-10': {
        filename: 'vid-10-customizer.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/customizer`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.goto(`${BASE_URL}/admin/customizer/themes`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-11': {
        filename: 'vid-11-orders.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.goto(`${BASE_URL}/admin/orders/1`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-12': {
        filename: 'vid-12-customers-reviews.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/reviews`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/inquiries`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
        },
    },
    'vid-13': {
        filename: 'vid-13-payments-shipping.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/payment-methods`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/shipping-zones`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/coupons`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
        },
    },
    'vid-14': {
        filename: 'vid-14-checkout-demo.webm',
        auth: false,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.goto(`${BASE_URL}/track-order`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-15': {
        filename: 'vid-15-analytics.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/analytics`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 350);
            await page.waitForTimeout(900);
        },
    },
    'vid-16': {
        filename: 'vid-16-import-export.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/import-export`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/print/catalog`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
    'vid-17': {
        filename: 'vid-17-users-roles-audit.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/roles`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/system/audit-logs`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
        },
    },
    'vid-18': {
        filename: 'vid-18-system-suite.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/system/backups`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/system/updates`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.goto(`${BASE_URL}/admin/system/license`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
        },
    },
    'vid-19': {
        filename: 'vid-19-sales-demo.webm',
        auth: false,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/demo/presentation`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(900);
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(900);
        },
    },
    'vid-20': {
        filename: 'vid-20-deployment.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/system/health`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/system-tools`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/system/support`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(900);
        },
    },
};

const args = process.argv.slice(2);
const onlyMissing = args.includes('--missing');
const explicitIds = args.filter((a) => !a.startsWith('--'));
let keys = explicitIds.length > 0 ? explicitIds.filter((id) => RECIPES[id]) : Object.keys(RECIPES);

if (onlyMissing) {
    keys = keys.filter((id) => !fs.existsSync(path.join(OUT_DIR, RECIPES[id].filename)));
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });

for (const id of keys) {
    const recipe = RECIPES[id];
    console.log(`Recording ${id} -> ${recipe.filename}`);
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: TMP_DIR, size: { width: 1280, height: 720 } },
    });
    const page = await context.newPage();

    if (recipe.auth) {
        await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
        await page.fill('input[type="email"]', 'admin@Sannafly.test');
        await page.fill('input[type="password"]', 'Password123!');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
            page.click('button[type="submit"]'),
        ]);
        await page.waitForTimeout(350);
    }

    await recipe.steps(page);
    const video = page.video();
    await context.close();
    if (video) {
        const tmpPath = await video.path();
        const destPath = path.join(OUT_DIR, recipe.filename);
        fs.copyFileSync(tmpPath, destPath);
        fs.unlinkSync(tmpPath);
        console.log(`Saved ${destPath}`);
    }
}

await browser.close();
fs.rmSync(TMP_DIR, { recursive: true, force: true });
