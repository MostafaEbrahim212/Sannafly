<?php

use App\Support\Money;

it('normalizes and rounds half-up at internal and gateway scales', function () {
    expect(Money::normalize('10'))->toBe('10.0000');
    expect(Money::normalize('10.12345'))->toBe('10.1235');
    expect(Money::normalize('10.12344'))->toBe('10.1234');
    expect(Money::toGateway('10.125'))->toBe('10.13');
    expect(Money::toGateway('10.124'))->toBe('10.12');
    expect(Money::roundHalfUp('-0.00001', 4))->toBe('0.0000');
    expect(Money::roundHalfUp('-1.235', 2))->toBe('-1.24');
});

it('performs exact BCMath arithmetic and comparisons', function () {
    expect(Money::add('0.1', '0.2'))->toBe('0.3000');
    expect(Money::sub('100.00', '33.33'))->toBe('66.6700');
    expect(Money::mul('19.99', '3'))->toBe('59.9700');
    expect(Money::div('100', '3'))->toBe('33.3333');
    expect(Money::comp('10.00', '10'))->toBe(0);
    expect(Money::min('5.5', '3.2'))->toBe('3.2000');
    expect(Money::max('5.5', '3.2'))->toBe('5.5000');
});

it('throws on invalid monetary strings and division by zero', function () {
    expect(fn () => Money::normalize(''))->toThrow(InvalidArgumentException::class);
    expect(fn () => Money::normalize('abc'))->toThrow(InvalidArgumentException::class);
    expect(fn () => Money::div('10', '0'))->toThrow(InvalidArgumentException::class);
});
