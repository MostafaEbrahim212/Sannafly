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
            await page.waitForTimeout(1000);
            await page.mouse.wheel(0, 500);
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
        },
    },
    'vid-02': {
        filename: 'vid-02-dashboard.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1200);
            await page.mouse.wheel(0, 350);
            await page.waitForTimeout(900);
            await page.goto(`${BASE_URL}/admin/notifications`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
        },
    },
    'vid-04': {
        filename: 'vid-04-products.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1100);
            await page.goto(`${BASE_URL}/admin/products/create`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1200);
        },
    },
    'vid-10': {
        filename: 'vid-10-customizer.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/customizer`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1200);
            await page.goto(`${BASE_URL}/admin/customizer/themes`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1100);
        },
    },
    'vid-11': {
        filename: 'vid-11-orders.webm',
        auth: true,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1200);
            await page.goto(`${BASE_URL}/admin/orders/1`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1100);
        },
    },
    'vid-19': {
        filename: 'vid-19-sales-demo.webm',
        auth: false,
        steps: async (page) => {
            await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.goto(`${BASE_URL}/demo/presentation`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1200);
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(1000);
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(1000);
        },
    },
};

const targetArg = process.argv[2];
const keys = targetArg && RECIPES[targetArg] ? [targetArg] : Object.keys(RECIPES);

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
        await page.waitForTimeout(400);
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
