# Configuration

```bash
php artisan vendor:publish --tag=datagrid-config
```

| Key | Default | Meaning |
| --- | --- | --- |
| `view_profiles.model` | `App\Models\DatatableViewProfile` | The model behind [saved views](/saved-views). |
| `view_profiles.max_per_section` | `50` | Views one user may keep per list. |
| `view_profiles.ref_length` | `10` | Length of the public reference in shared links. |

Only read when saved views are used.

## Page Sizes

`PerPageEnum` holds the sizes the pagination select offers — `5, 10, 30, 50, 100, 200` —
and `sanitize()` falls back to its default for anything else:

```php
$perPage = PerPageEnum::sanitize((int) $request->query('perPage', 30));
```
