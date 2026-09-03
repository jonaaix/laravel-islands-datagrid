# Saved Views

A view is the state a reader arrived at — filters, sort, columns — with a name. Users
keep it, open it with one click, share it by link and make it their default. The package
ships the endpoints, the ownership rules, a payload schema and the menu.

## Model

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
});
```

The model is `App\Models\DatatableViewProfile` by default ([configurable](/configuration))
with `payload` cast to array. `section` names the list a view belongs to, so one table
serves every list.

## Schema

A view's payload is written by one user and read by everyone who follows the link. The
schema allowlists what it may contain; anything undeclared is dropped on save.

```php
class InvoicesViewProfiles
{
    public static function store(): ViewProfileStore
    {
        return new ViewProfileStore('invoices', ViewProfileSchema::make()
            ->text('q')
            ->choice('status', InvoicesQuery::STATUSES)
            ->id('customer')
            ->date('created_from')
            ->flag('overdue_only')
            ->choice('sort', InvoicesQuery::SORTABLE)
            ->choice('dir', ['asc', 'desc'])
            ->keyList('cols', InvoicesColumns::KEYS));
    }
}
```

Rules: `text(key, max)`, `id`, `flag`, `tristate`, `date`, `choice(key, options)`,
`keyList(key, options)`.

::: danger Not optional
Without a schema, a saved view is a stored payload under user control that lands in
another user's state.
:::

## Endpoints

```php
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
Route::post('profiles', [InvoicesIslandController::class, 'storeViewProfile'])->name('profiles.store');
Route::patch('profiles/{profile}', [InvoicesIslandController::class, 'updateViewProfile'])->name('profiles.update');
Route::delete('profiles/{profile}', [InvoicesIslandController::class, 'destroyViewProfile'])->name('profiles.destroy');
```

Store takes `{ name, payload }`, update any of `name`, `payload`, `is_default`;
`{profile}` is the ten-character public reference. Update and delete are owner-only.

## Props

```php
$store = InvoicesViewProfiles::store();
$ref = (string) $request->query('view', '');

return [
    'profilesUrl' => route('islands.invoices.profiles.store'),
    'profileUrl' => route('islands.invoices.profiles.update', ['profile' => '__REF__']),
    'profiles' => $store->presentAll($store->forUser($request->user()?->id)),
    'activeProfile' => $ref !== '' ? $store->shared($ref, $request->user()?->id) : null,
];
```

## Composable and Menu

```js
const views = useViewProfiles({
    state,
    defaults: DEFAULTS,
    keys: ['q', 'status', 'customer', 'created_from', 'sort', 'dir', 'cols'],
    storeUrl: props.profilesUrl,
    profileUrl: props.profileUrl,
    initial: props.profiles,
    shared: props.activeProfile,
    plain: { cols: props.preferences.cols },
    apply: () => reload({ resetPage: true }),
    onError: (message) => toast.danger(message),
});
```

Add `view: ''` to `defaults` and `clientOnly` — the active reference lives in the URL,
which is what makes a view shareable. `plain` is what "reset view" lands on.

```vue
<ViewProfileMenu
    class="ml-auto"
    :profiles="views.profiles.value" :active="views.active.value"
    :changed="views.changed.value" :dirty="views.dirty.value" :busy="views.busy.value"
    @apply="views.open" @reset="views.reset" @save="views.save" @update="views.replace"
    @rename="views.rename" @remove="views.remove"
    @set-default="views.setDefault(true)" @unset-default="views.setDefault(false)"
/>
```

The menu renders an icon button with no active view and a tinted pill with the view's
name otherwise. Every label is translatable through the `labels` prop.
