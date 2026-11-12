<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Preferences;

use BackedEnum;
use Illuminate\Database\Eloquent\Model;

/**
 * The preferences of one table, read and written for the signed-in person.
 */
class PreferenceStore
{
    private readonly string $section;

    public function __construct(
        BackedEnum|string $section,
        private readonly PreferenceSchema $schema,
    ) {
        $this->section = $section instanceof BackedEnum ? (string) $section->value : $section;
    }

    public function schema(): PreferenceSchema
    {
        return $this->schema;
    }

    /**
     * @return array<string, mixed>
     */
    public function forUser(?int $userId): array
    {
        if ($userId === null) {
            return $this->schema->resolve([]);
        }

        $stored = self::model()::query()
            ->where('user_id', $userId)
            ->where('section', $this->section)
            ->pluck('value', 'key')
            ->all();

        return $this->schema->resolve($stored);
    }

    public function put(int $userId, string $key, mixed $value): void
    {
        self::model()::query()->updateOrCreate(
            ['user_id' => $userId, 'section' => $this->section, 'key' => $key],
            ['value' => $value],
        );
    }

    /**
     * @return class-string<Model>
     */
    public static function model(): string
    {
        /** @var class-string<Model> $class */
        $class = config('datagrid.preferences.model');

        return $class;
    }
}
