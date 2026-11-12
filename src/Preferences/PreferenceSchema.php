<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Preferences;

/**
 * What a table may remember for a person, and what it falls back to.
 *
 * The frontend writes these values itself, so nothing undeclared is stored and every declared
 * key is cast to the shape it promises before it is kept or handed back.
 */
class PreferenceSchema
{
    /** @var array<string, array{type: string, default: mixed, options?: array<int, mixed>, min?: int, max?: int}> */
    private array $rules = [];

    public static function make(): self
    {
        return new self;
    }

    /**
     * The column choice, kept as its deviations from the defaults — `key` switched on, `-key`
     * switched off — so a column added later still shows up for someone who chose before.
     *
     * @param  array<int, string>  $keys
     */
    public function columns(array $keys, string $key = 'columns'): self
    {
        $this->rules[$key] = ['type' => 'columns', 'default' => '', 'options' => $keys];

        return $this;
    }

    /**
     * One of a fixed set.
     *
     * @param  array<int, mixed>  $options
     */
    public function choice(string $key, array $options, mixed $default): self
    {
        $this->rules[$key] = ['type' => 'choice', 'default' => $default, 'options' => $options];

        return $this;
    }

    public function number(string $key, int $min, int $max, int $default): self
    {
        $this->rules[$key] = ['type' => 'number', 'default' => $default, 'min' => $min, 'max' => $max];

        return $this;
    }

    public function flag(string $key, bool $default = false): self
    {
        $this->rules[$key] = ['type' => 'flag', 'default' => $default];

        return $this;
    }

    /**
     * @return array<int, string>
     */
    public function keys(): array
    {
        return array_keys($this->rules);
    }

    public function declares(string $key): bool
    {
        return isset($this->rules[$key]);
    }

    /**
     * The value as it would be kept, or null when the key is unknown or the value does not fit.
     */
    public function cast(string $key, mixed $value): mixed
    {
        $rule = $this->rules[$key] ?? null;

        if ($rule === null || is_array($value)) {
            return null;
        }

        // An empty column choice arrives as null once the framework has trimmed it, and means "the defaults".
        if ($value === null) {
            return $rule['type'] === 'columns' ? '' : null;
        }

        return match ($rule['type']) {
            'columns' => $this->columnChoice((string) $value, $rule['options'] ?? []),
            'choice' => $this->option($value, $rule['options'] ?? []),
            'number' => is_numeric($value) && (int) $value >= $rule['min'] && (int) $value <= $rule['max'] ? (int) $value : null,
            'flag' => filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            default => null,
        };
    }

    /**
     * Every declared key, from what was stored where it still fits and from its default otherwise.
     *
     * @param  array<string, mixed>  $stored
     * @return array<string, mixed>
     */
    public function resolve(array $stored): array
    {
        $resolved = [];

        foreach ($this->rules as $key => $rule) {
            $resolved[$key] = $this->cast($key, $stored[$key] ?? null) ?? $rule['default'];
        }

        return $resolved;
    }

    /**
     * @param  array<int, mixed>  $options
     */
    private function option(mixed $value, array $options): mixed
    {
        foreach ($options as $option) {
            if ((string) $option === (string) $value) {
                return $option;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $options
     */
    private function columnChoice(string $value, array $options): ?string
    {
        $entries = array_values(array_filter(array_map('trim', explode(',', $value)), fn (string $entry): bool => $entry !== ''));

        foreach ($entries as $entry) {
            if (! in_array(ltrim($entry, '-'), $options, true)) {
                return null;
            }
        }

        return implode(',', array_values(array_unique($entries)));
    }
}
