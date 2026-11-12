<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Concerns;

use Aaix\LaravelIslandsDatagrid\Preferences\PreferenceStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The endpoint a table writes a person's preferences to — the column choice and whatever else
 * its schema declares. Whatever the controller already does to authorise a request happens in
 * `authorizePreferences()`.
 */
trait HandlesPreferences
{
    abstract protected function preferences(): PreferenceStore;

    protected function authorizePreferences(): void {}

    public function updatePreference(Request $request): JsonResponse
    {
        $this->authorizePreferences();

        $store = $this->preferences();

        $validated = $request->validate([
            'key' => ['required', 'string', Rule::in($store->schema()->keys())],
            'value' => ['present'],
        ]);

        $value = $store->schema()->cast($validated['key'], $validated['value']);

        if ($value === null) {
            throw ValidationException::withMessages([
                'value' => __('Not a valid value for :key.', ['key' => $validated['key']]),
            ]);
        }

        $store->put((int) Auth::id(), $validated['key'], $value);

        return response()->json(['data' => [$validated['key'] => $value]]);
    }
}
