<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Enums;

/**
 * The canonical per-page choices the datagrid ships with. Use it whenever a
 * data endpoint validates the incoming `perPage` — a case comparison stays in
 * step with the JS-side default set instead of drifting across tables.
 */
enum PerPageEnum: int
{
    case Five = 5;
    case Ten = 10;
    case Thirty = 30;
    case Fifty = 50;
    case Hundred = 100;
    case TwoHundred = 200;

    /**
     * Default page size when no client-side choice has been made yet.
     */
    public const int DEFAULT = 50;

    /**
     * @return array<int, int>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case): int => $case->value, self::cases());
    }

    /**
     * Clamps an arbitrary integer to the nearest allowed page size. Values not in
     * the set are floored to {@see self::DEFAULT} — an invalid `?perPage=` in the
     * URL therefore stays inside the enum instead of leaking to `LIMIT`.
     */
    public static function sanitize(int $value): int
    {
        return in_array($value, self::values(), true) ? $value : self::DEFAULT;
    }
}
