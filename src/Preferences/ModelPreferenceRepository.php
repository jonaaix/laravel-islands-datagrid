<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Preferences;

use Illuminate\Database\Eloquent\Model;

/**
 * Preferences in a table of their own: one row per person, section and key.
 */
class ModelPreferenceRepository implements PreferenceRepository
{
    public function all(int $userId, string $section): array
    {
        return self::model()::query()
            ->where('user_id', $userId)
            ->where('section', $section)
            ->pluck('value', 'key')
            ->all();
    }

    public function put(int $userId, string $section, string $key, mixed $value): void
    {
        self::model()::query()->updateOrCreate(
            ['user_id' => $userId, 'section' => $section, 'key' => $key],
            ['value' => $value],
        );
    }

    /**
     * @return class-string<Model>
     */
    private static function model(): string
    {
        /** @var class-string<Model> $class */
        $class = config('datagrid.preferences.model');

        return $class;
    }
}
