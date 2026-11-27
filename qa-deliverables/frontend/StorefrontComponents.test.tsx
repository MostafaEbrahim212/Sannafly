import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import Cart from '@/Pages/Storefront/Cart';

describe('Cart page', () => {
    it('renders empty cart state without accessibility violations', async () => {
        const { container } = render(
            <Cart
                items={[]}
                savedAddresses={[]}
                paymentMethods={[]}
                shippingZones={[]}
                appliedCoupon={null}
                idempotencyKey="test-idem-key"
            />
        );

        expect(screen.getByRole('heading')).toBeInTheDocument();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('renders cart items and coupon discount summary', () => {
        render(
            <Cart
                items={[
                    {
                        key: '1-0',
                        product_id: 1,
                        variation_id: null,
                        name: 'Wireless Mouse',
                        sku: 'MS-01',
                        unit_price: 200,
                        quantity: 2,
                        image: null,
                    },
                ]}
                savedAddresses={[]}
                paymentMethods={[
                    {
                        id: 1,
                        name: 'Cash on Delivery',
                        name_ar: 'الدفع عند الاستلام',
                        driver: 'cod',
                    },
                ]}
                shippingZones={[
                    {
                        id: 1,
                        name: 'Cairo',
                        name_ar: 'القاهرة',
                        cities: ['Cairo'],
                        rate: '50.0000',
                        free_shipping_threshold: '1000.0000',
                        is_default: true,
                    },
                ]}
                appliedCoupon={{
                    code: 'SAVE10',
                    type: 'fixed',
                    value: 10,
                    discount_amount: 10,
                }}
                idempotencyKey="test-idem-key"
            />
        );

        expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
        expect(screen.getByText('SAVE10')).toBeInTheDocument();
    });
});
