<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Preferences;

/**
 * Where a person's table preferences live. An application that already keeps per-user settings
 * binds an adapter over them to this interface.
 */
interface PreferenceRepository
{
    /**
     * @return array<string, mixed>
     */
    public function all(int $userId, string $section): array;

    public function put(int $userId, string $section, string $key, mixed $value): void;
}
