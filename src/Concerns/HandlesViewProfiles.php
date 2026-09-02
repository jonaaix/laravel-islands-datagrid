<?php

declare(strict_types=1);

namespace Aaix\LaravelIslandsDatagrid\Concerns;

use Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * The three endpoints a table needs to let people keep their own views.
 *
 * A controller says which section it stores under and what a payload may carry, points three
 * routes here, and is done. Whatever it already does to authorise a request happens in
 * `authorizeViewProfiles()`.
 */
trait HandlesViewProfiles
{
    abstract protected function viewProfiles(): ViewProfileStore;

    protected function authorizeViewProfiles(): void {}

    public function storeViewProfile(Request $request): JsonResponse
    {
        $this->authorizeViewProfiles();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:'.ViewProfileStore::MAX_NAME_LENGTH],
            'payload' => ['present', 'array'],
        ]);

        $store = $this->viewProfiles();

        if ($store->reachedLimit(Auth::id())) {
            throw ValidationException::withMessages([
                'name' => __('You have reached the maximum number of saved views.'),
            ]);
        }

        $profile = $store->create(Auth::id(), $validated['name'], $validated['payload']);

        return $this->viewProfilesResponse($store->present($profile));
    }

    public function updateViewProfile(Request $request, string $profile): JsonResponse
    {
        $this->authorizeViewProfiles();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:'.ViewProfileStore::MAX_NAME_LENGTH],
            'payload' => ['sometimes', 'array'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $store = $this->viewProfiles();
        $record = $this->ownedViewProfile($profile);

        $store->update(
            $record,
            $validated['name'] ?? null,
            $validated['payload'] ?? null,
            array_key_exists('is_default', $validated) ? (bool) $validated['is_default'] : null,
        );

        return $this->viewProfilesResponse($store->present($record));
    }

    public function destroyViewProfile(string $profile): JsonResponse
    {
        $this->authorizeViewProfiles();

        $this->ownedViewProfile($profile)->delete();

        return $this->viewProfilesResponse();
    }

    /**
     * A view belongs to the person who saved it. Someone else may open it by link, but only its
     * owner may rename, change or delete it.
     */
    private function ownedViewProfile(string $ref): Model
    {
        $store = $this->viewProfiles();
        $record = $store->findByRef($ref);

        if ($record === null || ! $store->owns($record, Auth::id())) {
            throw new AccessDeniedHttpException;
        }

        return $record;
    }

    /**
     * @param  array{ref: string, name: string, payload: array<string, mixed>}|null  $profile
     */
    private function viewProfilesResponse(?array $profile = null): JsonResponse
    {
        $data = ['profiles' => $this->viewProfiles()->forUser(Auth::id())];

        if ($profile !== null) {
            $data['profile'] = $profile;
        }

        return response()->json(['data' => $data]);
    }
}
