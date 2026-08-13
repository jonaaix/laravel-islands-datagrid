<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\ViewProfiles;

/**
 * What a saved view may carry.
 *
 * A payload travels to other people through a shared link, so it may only ever describe how a
 * table is narrowed — never what it may reach. Anything not declared here is dropped rather
 * than stored, and every declared key is cast to the shape it promises.
 */
class ViewProfileSchema
{
    /** @var array<string, array{type: string, options?: array<int, mixed>, max?: int}> */
    private array $rules = [];

    public static function make(): self
    {
        return new self();
    }

    /** Free text, cut to a length nobody has to defend. */
    public function text(string $key, int $max = 100): self
    {
        $this->rules[$key] = ['type' => 'text', 'max' => $max];

        return $this;
    }

    /** A positive number, dropped when it is zero — the state of not having chosen. */
    public function id(string $key): self
    {
        $this->rules[$key] = ['type' => 'id'];

        return $this;
    }

    /** On or off, kept only when on. */
    public function flag(string $key): self
    {
        $this->rules[$key] = ['type' => 'flag'];

        return $this;
    }

    /** On, off, or not asked — kept for the first two. */
    public function tristate(string $key): self
    {
        $this->rules[$key] = ['type' => 'tristate'];

        return $this;
    }

    /** A day as `YYYY-MM-DD`. */
    public function date(string $key): self
    {
        $this->rules[$key] = ['type' => 'date'];

        return $this;
    }

    /**
     * One of a fixed set.
     *
     * @param  array<int, mixed>  $options
     */
    public function choice(string $key, array $options): self
    {
        $this->rules[$key] = ['type' => 'choice', 'options' => $options];

        return $this;
    }

    /**
     * A comma-separated list of known keys, in the order they were declared.
     *
     * @param  array<int, string>  $options
     */
    public function keyList(string $key, array $options): self
    {
        $this->rules[$key] = ['type' => 'key_list', 'options' => $options];

        return $this;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function sanitize(array $payload): array
    {
        $clean = [];

        foreach ($this->rules as $key => $rule) {
            $value = $this->cast($rule, $payload[$key] ?? null);

            if ($value !== null) {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }

    /**
     * @param  array{type: string, options?: array<int, mixed>, max?: int}  $rule
     */
    private function cast(array $rule, mixed $value): mixed
    {
        return match ($rule['type']) {
            'text' => ($text = mb_substr(trim((string) $value), 0, $rule['max'] ?? 100)) === '' ? null : $text,
            'id' => ($id = (int) $value) > 0 ? $id : null,
            'flag' => filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : null,
            'tristate' => in_array((string) $value, ['0', '1'], true) ? (string) $value : null,
            'date' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $value) ? (string) $value : null,
            'choice' => in_array($value, $rule['options'] ?? [], true) ? $value : null,
            'key_list' => $this->keys((string) $value, $rule['options'] ?? []),
            default => null,
        };
    }

    /**
     * @param  array<int, string>  $options
     */
    private function keys(string $value, array $options): ?string
    {
        $wanted = array_filter(
            array_map('trim', explode(',', $value)),
            fn (string $key): bool => in_array($key, $options, true),
        );

        $kept = implode(',', array_values(array_unique($wanted)));

        return $kept === '' ? null : $kept;
    }
}
