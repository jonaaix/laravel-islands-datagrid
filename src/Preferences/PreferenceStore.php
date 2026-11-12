<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Preferences;

/**
 * The preferences of one table, read and written for the signed-in person.
 */
class PreferenceStore
{
    public function __construct(
        private readonly string $section,
        private readonly PreferenceSchema $schema,
    ) {}

    public function schema(): PreferenceSchema
    {
        return $this->schema;
    }

    /**
     * @return array<string, mixed>
     */
    public function forUser(?int $userId): array
    {
        return $this->schema->resolve($userId === null ? [] : self::repository()->all($userId, $this->section));
    }

    public function put(int $userId, string $key, mixed $value): void
    {
        self::repository()->put($userId, $this->section, $key, $value);
    }

    private static function repository(): PreferenceRepository
    {
        return app(PreferenceRepository::class);
    }
}
