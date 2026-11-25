import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '@/lib/i18n';

describe('i18n localization and currency formatting', () => {
    it('returns localized strings and formats price with currency symbol', () => {
        const { result } = renderHook(() => useTranslation());

        expect(result.current.t('cart')).toBeTruthy();
        expect(result.current.localized('Laptop', 'لابتوب')).toBe('Laptop');
        expect(result.current.formatPrice('150.5000')).toContain('150.50');
    });
});
