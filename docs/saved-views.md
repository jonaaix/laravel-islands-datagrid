# Saved Views

A view is the state a reader arrived at — filters, sort, columns, page size — with a
name. Saved views let a user keep it, open it with one click, share it by link, and make
it the default for the next visit. The package ships the three endpoints, the ownership
rules, a schema that decides what a view may carry, and the menu.

## The Model

Saved views are stored in a table of your own. Create the model and the migration:

```bash
php artisan make:model DatatableViewProfile -m
```

```php
Schema::create('datatable_view_profiles', function (Blueprint $table) {
    $table->id();
    $table->string('public_ref', 10)->unique();
    $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
    $table->string('section', 60);
    $table->string('name', 60);
    $table->json('payload');
    $table->boolean('is_default')->default(false);
    $table->timestamps();

    $table->index(['section', 'user_id']);
});
```

The model is `App\Models\DatatableViewProfile` by default ([configurable](/configuration)),
with `payload` cast to array. `section` names the list a view belongs to, so one table
serves every list.

## The Schema

A view's payload is written by one user and read by everyone who follows the link. The
schema is the allowlist of what it may contain; anything undeclared is dropped on save,
so a shared view cannot smuggle a value into the next reader's table.

```php
<?php

declare(strict_types=1);

namespace App\Islands\Invoices\State;

use Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileSchema;
use Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileStore;
use App\Islands\Invoices\Queries\InvoicesQuery;

class InvoicesViewProfiles
{
    public static function store(): ViewProfileStore
    {
        return new ViewProfileStore('invoices', self::schema());
    }

    private static function schema(): ViewProfileSchema
    {
        return ViewProfileSchema::make()
            ->text('q')
            ->choice('status', InvoicesQuery::STATUSES)
            ->id('customer')
            ->date('created_from')
            ->date('created_until')
            ->flag('overdue_only')
            ->choice('sort', InvoicesQuery::SORTABLE)
            ->choice('dir', ['asc', 'desc'])
            ->choice('perPage', ['10', '30', '50', '100'])
            ->keyList('cols', InvoicesColumns::KEYS);
    }
}
```

| Rule | Keeps |
| --- | --- |
| `text(key, max = 100)` | A trimmed string, cut to `max`. Empty is dropped. |
| `id(key)` | A positive integer. |
| `flag(key)` | `1` for a truthy value; falsy is dropped. |
| `tristate(key)` | Only the strings `'0'` and `'1'`. |
| `date(key)` | Only `YYYY-MM-DD`. |
| `choice(key, options)` | Only a value from the list, compared strictly. |
| `keyList(key, options)` | A comma-separated list, trimmed, unknowns removed, de-duplicated. |

::: danger Not optional
Without a schema, a saved view is a stored payload under user control that lands in
another user's state. Declare every key the view may carry, and nothing else gets
through.
:::

## The Endpoints

Add the trait to the island controller and point three routes at it:

```php
use Aaix\LaravelIslandsDatagrid\Concerns\HandlesViewProfiles;
use Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileStore;

class InvoicesIslandController extends Controller
{
    use HandlesViewProfiles;

    protected function viewProfiles(): ViewProfileStore
    {
        return InvoicesViewProfiles::store();
    }

    protected function authorizeViewProfiles(): void
    {
        $this->authorizeAccess();
    }
}
```

```php
// Routes.php
Route::post('profiles', [InvoicesIslandController::class, 'storeViewProfile'])->name('profiles.store');
Route::patch('profiles/{profile}', [InvoicesIslandController::class, 'updateViewProfile'])->name('profiles.update');
Route::delete('profiles/{profile}', [InvoicesIslandController::class, 'destroyViewProfile'])->name('profiles.destroy');
```

| Route | Body | Rules |
| --- | --- | --- |
| `POST profiles` | `{ name, payload }` | `name` up to 60 characters; the per-user limit is enforced with a validation error. |
| `PATCH profiles/{ref}` | any of `name`, `payload`, `is_default` | Owner only. Setting a default clears the previous one in the section. |
| `DELETE profiles/{ref}` | — | Owner only. |

Each answers with the user's views and, for store and update, the affected one:

```json
{ "data": { "profiles": [ { "ref": "k3Qz9pL2Xa", "name": "Overdue this month", "is_default": false, "payload": {} } ], "profile": { … } } }
```

`{ref}` is the public reference, ten random characters — the part of a shared link that
names the view. Ownership is the same user *and* the same section; anyone else gets a 403.

## The Props

The island starts with the user's views, the active one if the URL names it, and the URLs:

```php
public function build(Request $request): array
{
    $store = InvoicesViewProfiles::store();
    $ref = (string) $request->query('view', '');

    return [
        'dataUrl' => route('islands.invoices.data'),
        'profilesUrl' => route('islands.invoices.profiles.store'),
        'profileUrl' => route('islands.invoices.profiles.update', ['profile' => '__REF__']),
        'profiles' => $store->presentAll($store->forUser($request->user()?->id)),
        'activeProfile' => $ref !== '' ? $store->shared($ref, $request->user()?->id) : null,
        // …
    ];
}
```

`shared()` returns a view another user owns — marked `owned: false` — or `null` when the
reference is the caller's own or unknown. `defaultFor()` returns the user's default view,
for a page that should open it when no `view` is in the URL.

## The Composable

```js
import { useViewProfiles } from '@aaix/laravel-islands-datagrid/vue';

const views = useViewProfiles({
    state,
    defaults: DEFAULTS,
    keys: ['q', 'status', 'customer', 'created_from', 'created_until', 'sort', 'dir', 'perPage', 'cols'],
    storeUrl: props.profilesUrl,
    profileUrl: props.profileUrl,
    initial: props.profiles,
    shared: props.activeProfile,
    plain: { cols: props.preferences.cols },
    apply: () => reload({ resetPage: true }),
    onError: (message) => toast.danger(message || t('Could not save this view')),
});
```

| Option | Default | Purpose |
| --- | --- | --- |
| `state`, `defaults` | required | The table's state and its contract. |
| `keys` | required | Which state keys a view describes. |
| `storeUrl` | required | The `POST` route. |
| `profileUrl` | required | The `PATCH`/`DELETE` route with the literal `__REF__`. |
| `stateKey` | `'view'` | The client-only state key that holds the active reference. Add it to `defaults` and `clientOnly`. |
| `initial` | `[]` | The user's views from the props. |
| `shared` | `null` | A view opened by link that belongs to someone else. |
| `plain` | `{}` | What "reset view" lands on — a remembered column choice, not the package's neutral defaults. |
| `apply(payload)` | | Called after a view was opened; reload the table here. |
| `onError(message)` | `null` | The first validation message, or the response's message. |

| Returns | Meaning |
| --- | --- |
| `profiles` | The user's own views. |
| `active` | The open view with an `owned` flag, or `null`. |
| `changed` | The state no longer matches the open view. |
| `dirty` | The state differs from `plain` — there is something worth saving. |
| `busy` | A request is in flight. |
| `save(name)`, `replace()`, `rename(name)`, `remove()` | The write operations. |
| `open(profile)`, `reset()` | Apply a view; go back to `plain`. |
| `setDefault(on)`, `openDefault()` | Mark the open view as the user's default; open the default when no view is set. |
| `payload()`, `write(next)` | The current view payload; apply a payload without a request. |

## The Menu

```vue
<ViewProfileMenu
    class="ml-auto"
    :profiles="views.profiles.value"
    :active="views.active.value"
    :changed="views.changed.value"
    :dirty="views.dirty.value"
    :busy="views.busy.value"
    @apply="views.open"
    @reset="views.reset"
    @save="views.save"
    @update="views.replace"
    @rename="views.rename"
    @remove="views.remove"
    @set-default="views.setDefault(true)"
    @unset-default="views.setDefault(false)"
/>
```

With no active view it renders an icon button; with one, a tinted pill with the view's
name, an asterisk while `changed`, and an × that resets. Every label is translatable
through the `labels` prop (`menu`, `save`, `saveAsNew`, `update`, `rename`, `remove`,
`reset`, `shared`, `yours`, `changed`, `placeholder`, `empty`, `setDefault`,
`unsetDefault`, `defaultTitle`); without it the strings go through `provideDatagrid()`.
