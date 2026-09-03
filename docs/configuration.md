# Configuration

```bash
php artisan vendor:publish --tag=datagrid-config
```

```php
// config/datagrid.php
use App\Models\DatatableViewProfile;

return [
    'view_profiles' => [
        'model' => DatatableViewProfile::class,
        'max_per_section' => 50,
        'ref_length' => 10,
    ],
];
```

| Key | Default | Meaning |
| --- | --- | --- |
| `view_profiles.model` | `App\Models\DatatableViewProfile` | The Eloquent model behind [saved views](/saved-views#the-model). Its table needs `public_ref`, `user_id`, `section`, `name`, a JSON `payload` and a boolean `is_default`. |
| `view_profiles.max_per_section` | `50` | How many views one user may keep per list. Reaching it fails the save with a validation message. |
| `view_profiles.ref_length` | `10` | Length of the public reference in shared links. Also the length an incoming reference is validated against — change it before the first view is saved, not after. |

The config is only read when saved views are used. An application that never saves a
view needs neither the model nor the published file.

## Page Sizes

The page sizes the `Pagination` select offers are fixed in the `PerPageEnum`:

```php
use Aaix\LaravelIslandsDatagrid\Enums\PerPageEnum;

PerPageEnum::values();          // [5, 10, 30, 50, 100, 200]
PerPageEnum::DEFAULT;           // 50
PerPageEnum::sanitize(75);      // 50 — not in the set
PerPageEnum::sanitize(100);     // 100
```

Use `sanitize()` where the query reads `perPage`, and pass the same list as
`perPageOptions` when a list offers fewer sizes. Note that the enum's default is 50 while
`DataTable`'s `perPage` prop defaults to 30 — a list decides its own starting size in
`DEFAULTS` and both follow it.

## Translated Strings

The package's own strings go through the translator handed to `provideDatagrid()`; see
[Installation](/installation#translating-the-built-in-strings) and the full list under
[Exports](/exports#translated-strings).
