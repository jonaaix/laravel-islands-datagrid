<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\ViewProfiles;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * The saved views of one table, read and written for the signed-in person.
 *
 * A table brings its section name and its schema; everything else about storing, listing and
 * presenting a view is the same wherever it is offered, and lives here.
 */
class ViewProfileStore
{
    public const MAX_NAME_LENGTH = 60;

    public function __construct(
        private readonly string $section,
        private readonly ViewProfileSchema $schema,
    ) {}

    /**
     * @return class-string<Model>
     */
    public static function model(): string
    {
        /** @var class-string<Model> $class */
        $class = config('datagrid.view_profiles.model');

        return $class;
    }

    /**
     * The views a person may pick from — their own, and nobody else's. A view someone shared is
     * reachable by its reference, but it never appears in a list that is not its owner's.
     *
     * @return array<int, array{ref: string, name: string, is_default: bool, payload: array<string, mixed>}>
     */
    public function forUser(?int $userId): array
    {
        $model = self::model();

        return $model::query()
            ->where('section', $this->section)
            ->where('user_id', $userId ?? 0)
            ->orderBy('name')
            ->get()
            ->map(fn (Model $profile): array => $this->present($profile))
            ->all();
    }

    /**
     * The view a person's table opens on when no link points at another one. Null when none is
     * marked, which is the state a fresh account is in.
     */
    public function defaultFor(?int $userId): ?Model
    {
        $model = self::model();

        return $model::query()
            ->where('section', $this->section)
            ->where('user_id', $userId ?? 0)
            ->where('is_default', true)
            ->first();
    }

    /**
     * A view opened by link that belongs to somebody else: handed over by name so the menu can
     * show a title rather than a reference.
     *
     * @return array{ref: string, name: string, payload: array<string, mixed>, owned: bool}|null
     */
    public function shared(string $ref, ?int $userId): ?array
    {
        $profile = $this->findByRef($ref);

        if ($profile === null || $profile->user_id === $userId) {
            return null;
        }

        return [...$this->present($profile), 'owned' => false];
    }

    public function findByRef(string $ref): ?Model
    {
        $model = self::model();
        $length = (int) config('datagrid.view_profiles.ref_length', 10);

        if (! preg_match('/^[A-Za-z0-9]{'.$length.'}$/', $ref)) {
            return null;
        }

        return $model::query()->where('section', $this->section)->where('public_ref', $ref)->first();
    }

    public function reachedLimit(?int $userId): bool
    {
        $model = self::model();
        $max = (int) config('datagrid.view_profiles.max_per_section', 50);

        return $model::query()
            ->where('section', $this->section)
            ->where('user_id', $userId ?? 0)
            ->count() >= $max;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(?int $userId, string $name, array $payload): Model
    {
        $model = self::model();

        return $model::query()->create([
            'public_ref' => $this->newRef(),
            'user_id' => $userId,
            'section' => $this->section,
            'name' => $this->name($name),
            'payload' => $this->schema->sanitize($payload),
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    public function update(Model $profile, ?string $name, ?array $payload, ?bool $isDefault = null): Model
    {
        if ($name !== null) {
            $profile->name = $this->name($name);
        }

        if ($payload !== null) {
            $profile->payload = $this->schema->sanitize($payload);
        }

        if ($isDefault !== null) {
            $this->applyDefault($profile, $isDefault);
        }

        $profile->save();

        return $profile;
    }

    private function applyDefault(Model $profile, bool $on): void
    {
        if ($on) {
            $model = self::model();

            $model::query()
                ->where('section', $this->section)
                ->where('user_id', $profile->user_id)
                ->where($profile->getKeyName(), '!=', $profile->getKey())
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $profile->is_default = $on;
    }

    public function name(string $name): string
    {
        return mb_substr(trim($name), 0, self::MAX_NAME_LENGTH);
    }

    public function owns(Model $profile, ?int $userId): bool
    {
        return $profile->section === $this->section && $profile->user_id === $userId;
    }

    /**
     * @return array{ref: string, name: string, is_default: bool, payload: array<string, mixed>}
     */
    public function present(Model $profile): array
    {
        return [
            'ref' => (string) $profile->public_ref,
            'name' => (string) $profile->name,
            'is_default' => (bool) $profile->is_default,
            'payload' => (array) $profile->payload,
        ];
    }

    /**
     * @param  Collection<int, Model>  $profiles
     * @return array<int, array{ref: string, name: string, payload: array<string, mixed>}>
     */
    public function presentAll(Collection $profiles): array
    {
        return $profiles->map(fn (Model $profile): array => $this->present($profile))->all();
    }

    private function newRef(): string
    {
        $model = self::model();
        $length = (int) config('datagrid.view_profiles.ref_length', 10);

        do {
            $ref = Str::random($length);
        } while ($model::query()->where('public_ref', $ref)->exists());

        return $ref;
    }
}
