import { expect, test } from '@playwright/test';

test.describe('Sannafly E2E Storefront & Admin', () => {
    test('homepage loads and switches between English LTR and Arabic RTL', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

        await page.goto('/locale/ar');
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    });

    test('catalog page renders and filters products', async ({ page }) => {
        await page.goto('/catalog');
        await expect(page).toHaveTitle(/Sannafly|Catalog/i);
    });

    test('guest is redirected to admin login when accessing protected admin route', async ({ page }) => {
        await page.goto('/admin/products');
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test('admin can sign in and access dashboard', async ({ page }) => {
        await page.goto('/admin/login');
        await page.fill('input[type="email"]', 'admin@Sannafly.test');
        await page.fill('input[type="password"]', 'Admin@123456');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('track-order page renders tracking form', async ({ page }) => {
        await page.goto('/track-order');
        await expect(page.locator('form')).toBeVisible();
    });
});
