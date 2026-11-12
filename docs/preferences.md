# Columns & Preferences

What a person chose for a table — which columns it shows, and whatever else the table lets
them keep — is stored per user, not per browser. The package ships the table, the schema
that decides what may be stored, the endpoint, and `useColumnPicker` for the frontend.

## Sections

Every table stores its saved views and its preferences under a section: one name per list,
shared by both stores. Sections live in **one backed enum** in the application — never as a
string in a store, a constant in a list class, or a literal in a test:

```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum DatagridSectionEnum: string
{
    case Invoices = 'invoices_list';
    case Customers = 'customers_list';
}
```

Both stores take the case: `new ViewProfileStore(DatagridSectionEnum::Invoices, …)`,
`new PreferenceStore(DatagridSectionEnum::Invoices, …)`. A value is stored in the database,
so it never changes once a list has saved anything under it.

## The Model

Preferences live in a table of their own, prefixed like the saved views:

```bash
php artisan make:model DatatablePreference -m
```

```php
Schema::create('datatable_preferences', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('section', 60);
    $table->string('key', 60);
    $table->json('value')->nullable();
    $table->timestamps();

    $table->unique(['user_id', 'section', 'key']);
});
```

The model is `App\Models\DatatablePreference` by default ([configurable](/configuration)),
with `value` cast to json. One table serves every list.

## The Schema

```php
use Aaix\LaravelIslandsDatagrid\Preferences\PreferenceSchema;
use Aaix\LaravelIslandsDatagrid\Preferences\PreferenceStore;
use App\Enums\DatagridSectionEnum;

class InvoicesPreferences
{
    /** Must match the column register in Support/Columns.js. */
    public const COLUMNS = ['number', 'customer', 'total', 'due_at', 'actions'];

    public static function store(): PreferenceStore
    {
        return new PreferenceStore(DatagridSectionEnum::Invoices, PreferenceSchema::make()
            ->choice('price_mode', ['net', 'gross'], 'net')
            ->columns(self::COLUMNS));
    }
}
```

| Rule | Keeps |
| --- | --- |
| `columns(keys, key = 'columns')` | The column choice as its deviations from the defaults — `key` on, `-key` off — so a column added later still shows up. Unknown keys refuse the whole value. |
| `choice(key, options, default)` | Only a value from the list. |
| `number(key, min, max, default)` | An integer within the bounds. |
| `flag(key, default = false)` | A boolean. |

`store()->forUser($id)` returns every declared key — stored where it still fits, the default
otherwise — for the page props.

## The Endpoint

```php
use Aaix\LaravelIslandsDatagrid\Concerns\HandlesPreferences;
use Aaix\LaravelIslandsDatagrid\Preferences\PreferenceStore;

class InvoicesIslandController extends Controller
{
    use HandlesPreferences;

    protected function preferences(): PreferenceStore
    {
        return InvoicesPreferences::store();
    }

    protected function authorizePreferences(): void
    {
        $this->authorizeAccess();
    }
}
```

```php
Route::patch('preferences', [InvoicesIslandController::class, 'updatePreference'])->name('preferences');
```

It takes `{ key, value }`, refuses a key the schema does not declare or a value that does not
fit, and answers `{ data: { [key]: value } }`.

## `useColumnPicker`

The column choice of one table. It is created before `useDataTable`, because the table's
defaults and first state come from it, and connected afterwards:

```js
import { ColumnPicker, useColumnPicker, useDataTable } from '@aaix/laravel-islands-datagrid/vue';

const columns = useColumnPicker(COLUMN_REGISTRY, {
    remembered: props.preferences.columns,
    remember: (value) => sendJson(props.preferencesUrl, 'PATCH', { key: 'columns', value }),
});

const DEFAULTS = { q: '', sort: 'number', dir: 'desc', page: 1, perPage: 30, cols: columns.defaultValue, view: '' };

const table = useDataTable(props.dataUrl, {
    defaults: DEFAULTS,
    initial: { ...props.initial, cols: columns.startValue },
    clientOnly: ['cols', 'view'],
});

columns.connect(table);
```

```vue
<ColumnPicker
    :columns="COLUMN_REGISTRY"
    :visible="columns.keys.value"
    :changed="columns.changed.value"
    :label="t('Columns')"
    :reset-label="t('Reset columns')"
    @update="columns.set"
    @reset="columns.reset" />
```

| Returns | Meaning |
| --- | --- |
| `defaultValue`, `startValue` | The default keys and the keys this person opens with — a `cols` in the URL wins over the remembered choice. |
| `keys`, `visible` | Computed: the visible keys, and the registry entries behind them for the header and rows. |
| `span` | Computed: the summed `span` of the visible columns, for `colCount`. |
| `changed` | Computed: whether the choice differs from the defaults. |
| `set(keys)`, `reset()` | Write the choice into the state and the URL, and hand it to `remember`. |

A registry entry is `{ key, label, default?, locked?, span? }`; a locked column is always
shown. The pure helpers — `defaultColumnKeys`, `resolveColumnKeys`, `visibleColumnKeys`,
`columnDeviationsFromDefaults`, `sameColumns` — are exported for the rare case outside a picker.
