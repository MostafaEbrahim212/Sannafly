<?php

namespace App\Support;

use InvalidArgumentException;

final class Money
{
    public const INTERNAL_SCALE = 4;

    public const GATEWAY_SCALE = 2;

    /**
     * Normalize a numeric string/int into a fixed-scale decimal string using half-up rounding.
     */
    public static function normalize(string|int $value, int $scale = self::INTERNAL_SCALE): string
    {
        $raw = trim((string) $value);
        if ($raw === '' || ! preg_match('/^[+-]?\d+(?:\.\d+)?$/', $raw)) {
            throw new InvalidArgumentException("Invalid monetary value: {$raw}");
        }

        return self::roundHalfUp($raw, $scale);
    }

    /**
     * Round a decimal string using half-up semantics via BCMath only.
     */
    public static function roundHalfUp(string $value, int $scale = self::INTERNAL_SCALE): string
    {
        $raw = trim($value);
        if ($raw === '' || ! preg_match('/^[+-]?\d+(?:\.\d+)?$/', $raw)) {
            throw new InvalidArgumentException("Invalid monetary value: {$raw}");
        }

        $negative = str_starts_with($raw, '-');
        $unsigned = ltrim($raw, '+-');

        if (! str_contains($unsigned, '.')) {
            $result = bcadd($unsigned, '0', $scale);

            return ($negative && bccomp($result, '0', $scale) !== 0) ? '-'.$result : $result;
        }

        [$intPart, $fracPart] = explode('.', $unsigned, 2);
        if (strlen($fracPart) <= $scale) {
            $result = bcadd($unsigned, '0', $scale);

            return ($negative && bccomp($result, '0', $scale) !== 0) ? '-'.$result : $result;
        }

        $nextDigit = (int) $fracPart[$scale];
        $truncated = $intPart.'.'.substr($fracPart, 0, $scale);
        if ($scale === 0) {
            $truncated = $intPart;
        }

        if ($nextDigit >= 5) {
            $increment = $scale === 0 ? '1' : '0.'.str_repeat('0', $scale - 1).'1';
            $result = bcadd($truncated, $increment, $scale);
        } else {
            $result = bcadd($truncated, '0', $scale);
        }

        return ($negative && bccomp($result, '0', $scale) !== 0) ? '-'.$result : $result;
    }

    public static function toGateway(string|int $value): string
    {
        return self::normalize($value, self::GATEWAY_SCALE);
    }

    public static function add(string $a, string $b, int $scale = self::INTERNAL_SCALE): string
    {
        return bcadd(self::normalize($a, $scale + 2), self::normalize($b, $scale + 2), $scale);
    }

    public static function sub(string $a, string $b, int $scale = self::INTERNAL_SCALE): string
    {
        return bcsub(self::normalize($a, $scale + 2), self::normalize($b, $scale + 2), $scale);
    }

    public static function mul(string $a, string $b, int $scale = self::INTERNAL_SCALE): string
    {
        $product = bcmul(self::normalize($a, $scale + 4), self::normalize($b, $scale + 4), $scale + 4);

        return self::roundHalfUp($product, $scale);
    }

    public static function div(string $a, string $b, int $scale = self::INTERNAL_SCALE): string
    {
        $divisor = self::normalize($b, $scale + 4);
        if (bccomp($divisor, '0', $scale + 4) === 0) {
            throw new InvalidArgumentException('Division by zero in Money::div.');
        }

        $quotient = bcdiv(self::normalize($a, $scale + 4), $divisor, $scale + 4);

        return self::roundHalfUp($quotient, $scale);
    }

    public static function comp(string $a, string $b, int $scale = self::INTERNAL_SCALE): int
    {
        return bccomp(self::normalize($a, $scale), self::normalize($b, $scale), $scale);
    }

    public static function min(string $a, string $b, int $scale = self::INTERNAL_SCALE): string
    {
        return self::comp($a, $b, $scale) <= 0
            ? self::normalize($a, $scale)
            : self::normalize($b, $scale);
    }

    public static function max(string $a, string $b, int $scale = self::INTERNAL_SCALE): string
    {
        return self::comp($a, $b, $scale) >= 0
            ? self::normalize($a, $scale)
            : self::normalize($b, $scale);
    }
}
