# Toolbar, Selection, Saved Views

Everything the package ships besides `useDataTable` and `DataTable`. All from
`@aaix/laravel-islands-datagrid/vue`.

None of it carries wording: every label is a prop, because the application owns
its language. Hand the package a translator once with
`provideDatagrid({ t, locale })` and the built-in strings follow it too.

## Pickers

### Combobox

One value from a list, with search. `variant` decides the look — and the default
is a form field:

| `variant` | Use |
| --- | --- |
| `field` (default) | inside a form, stays neutral when set |
| `filter` | in a toolbar, tints a set value |
| `filter-card` | the same inside a filter panel |

| Prop | Default | Purpose |
| --- | --- | --- |
| `modelValue` / `emptyValue` | `0` / `0` | the value, and the one that means "nothing chosen" — pass `""` for string filters |
| `options` | `{}` | `{value: label}` or `[{value, label, depth?}]` |
| `fetchOptions` / `fetchDelay` / `loadingLabel` | `null` / `150` | let the server answer each search; `options` then only holds the preloaded first page |
| `selectedLabel` | `''` | the label of a value outside that first page — without it a deep link shows the placeholder |
| `searchValues` | `false` | search the values too, not only the labels |
| `keepAncestors` | `false` | in a list with `depth`, a match keeps what it sits under, so searching narrows a tree |
| `maxOptions` | `60` | how many entries the list may show at once; zero shows all |
| `clearOption` | `true` | the row that resets the choice |
| `menuWidth` / `menuHeight` | `288` / `240` | room for long or deeply named lists |
| `placeholder`, `searchPlaceholder`, `allLabel`, `emptyLabel` | | the words |

Slots `option` and `selected` take over the rendering.

### TreeSelect

A hierarchy, searchable by path. Either hand it `options`, or an `optionsUrl` —
then it fetches once per URL and caches, so several rows sharing a tree cost one
request.

| Prop | Default | Purpose |
| --- | --- | --- |
| `modelValue` | `null` | the chosen leaf |
| `options` / `optionsUrl` | `null` / `''` | the tree, or where to get it |
| `selectedPath` / `separator` | `''` / `»` | what the trigger shows, and how a path reads |
| `countLabelFor` | `null` | a function turning an entry into a trailing count |
| `clearable` / `clearLabel` | `false` | an X on the trigger |
| `resultLimit` | `200` | how many matches a search may show |
| `width` / `listHeight` | `480` / `20rem` | the menu's room |
| `placeholder`, `searchPlaceholder`, `loadingLabel`, `errorLabel`, `retryLabel`, `emptyLabel`, `hintLabel` | | the words |

Emits `update:modelValue`, `open`, `close`. The trigger is a slot, so it fits a
toolbar as well as a table cell.

### MultiSelect

Several values from one list. Shows the first `previewLimit` choices, each cut at
`previewChars`, then "+n".

| Prop | Default |
| --- | --- |
| `modelValue` | `[]` |
| `options` | `{}` |
| `previewLimit` / `previewChars` | `3` / `14` |
| `variant` | `filter` |
| `menuWidth` / `menuHeight` | `288` / `320` |
| `placeholder`, `allLabel`, `emptyLabel` | |

### OptionStrip

A micro switcher: one of n, or a switch per option.

| Prop | Default | Purpose |
| --- | --- | --- |
| `options` | `[]` | `{ value, label, hint?, count? }` |
| `modelValue` | `null` | one value, or an array while `multiple` |
| `multiple` | `false` | every option becomes its own on/off |
| `clearable` | `false` | picking the taken one lets go of it again; ignored while `multiple` |
| `variant` | `pills` | `pills` is a row of switches, `segmented` reads as one question with n answers |

## Search and chrome

### SearchInput

`modelValue`, `placeholder`, `clearLabel` → `update:modelValue` (wire to
`onSearchInput`) and `clear` (to `clearSearch`).

### FilterPanel

The panel beside the table: `title` → `close`. It docks itself where the viewport
allows and floats over the table where it does not.

### Pagination

`DataTable` renders it already; use it standalone only outside a table.

| Prop | Default | Purpose |
| --- | --- | --- |
| `meta` | — | **required**, the response meta |
| `perPage` | — | **required** |
| `perPageOptions` | `[5, 10, 30, 50, 100, 200]` | |
| `pageCount` | `7` | how many page buttons — a window that slides rather than grows, so buttons do not move under the pointer |
| `compact` | `false` | drops the page jumper for narrow places |

Emits `page-change`, `per-page-change`.

### ColumnPicker

`columns` (the register), `visible` (the keys currently shown), `changed` (whether
that differs from the default), `label`, `resetLabel`. Emits `update` with the new
keys and `reset`.

A column register is one array of `{ key, label, default, locked }` — `locked`
columns cannot be hidden.

## Selection

`useSelection(rows, { key = 'id', matchedTotal })` — row selection with two
scopes.

`page` collects the ids that were ticked. `matching` means "everything the current
filter answers with", which is a promise about rows that were never loaded, so it
holds the ones ticked *off* again instead. That is what makes acting on a whole
filtered result possible without carrying thousands of ids around.

| Returns | Meaning |
| --- | --- |
| `scope` | `'page'` or `'matching'` |
| `isMatchingScope` | the wider scope is active |
| `canSelectMatching` | there are more matches than rows on screen — otherwise offering it is pointless |
| `matched` | how many the filter matches (from `matchedTotal`) |
| `ids` / `excludedIds` | the ticked ones, or the ticked-off ones — the other is empty |
| `count`, `any` | how many are selected either way |
| `allOnPage`, `someOnPage` | for the header box's checked and indeterminate state |
| `has(id)`, `set(id, on)`, `toggle(id)` | per row |
| `togglePage()` | the header box: fills or empties the current page |
| `selectMatching()`, `selectPage()` | switch scope |
| `remove(id)`, `clear()` | after deleting a row, or to start over |

`matchedTotal` is usually `computed(() => meta.value.total ?? 0)`. Without it the
wider scope stays unavailable and a table behaves exactly as before.

```js
const matchedTotal = computed(() => Number(meta.value.total ?? 0));
const selection = useSelection(rows, { matchedTotal });
```

::: warning A selection describes a result
It cannot outlive the filter that produced it — watch your filter keys and
`clear()` when they change, or "all matches" comes to mean something else than
what the user agreed to.
:::

The scope travels to the server as an intent, never as ids:

```js
const body = selection.isMatchingScope.value
    ? { scope: 'matching', filter: { …state }, except: selection.excludedIds.value, expectedCount: selection.count.value }
    : { ids: selection.ids.value };
```

Sending `expectedCount` lets the endpoint refuse a set that has grown or shrunk
since it was agreed to, instead of applying the action to whatever it is now. The
package does not prescribe this shape — it hands over the intent, the application
owns its endpoint.

### SelectionBox

The checkbox itself: `checked`, `indeterminate`, `disabled`, `label` → `change`.
It stops the click from reaching the row, so a selectable row can still be
expandable.

## Saved views

### useViewProfiles

Keeps a user's saved views and the one currently applied.

| Option | Purpose |
| --- | --- |
| `state`, `defaults`, `keys` | the table state, and which keys a view stores |
| `storeUrl`, `profileUrl` | where to create, and the single-profile URL with a `__REF__` placeholder |
| `stateKey` | which state key holds the applied view's reference, `view` by default |
| `initial`, `shared` | what the server sent: the user's own views, plus one opened from a link |
| `plain` | keys stored as they are, without the filter shape |
| `apply` | called with a payload the user picked — the table decides how to adopt it |
| `onError` | so the view can say what failed |

Returns `profiles`, `active`, `changed`, `dirty`, `busy`, `payload()`, `save`,
`replace`, `rename`, `remove`, `open`, `reset`, `write`.

### ViewProfileMenu

`profiles`, `active`, `changed`, `dirty`, `busy`, `labels` (every word it needs) →
`apply`, `reset`, `save`, `update`, `rename`, `remove`, `copy`. Wire each event to
the composable's method of the same name.

### The PHP side

The three endpoints behind the menu ship with the package:

```php
use Aaix\LaravelIslandsDatagrid\Concerns\HandlesViewProfiles;
use Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileStore;

class InvoicesIslandController extends Controller
{
    use HandlesViewProfiles;

    protected function viewProfiles(): ViewProfileStore
    {
        return InvoiceViewProfiles::store();
    }
}
```

`storeViewProfile`, `updateViewProfile` and `destroyViewProfile` come from the
trait — point three routes at them and override `authorizeViewProfiles()`.
Ownership, the per-user limit and the public reference are the store's business.

A `ViewProfileSchema` declares what a saved payload may carry — `text`, `id`,
`flag`, `tristate`, `date`, `choice`, `keyList`, each with its allowed values — and
`sanitize()` drops the rest, so a view shared by link cannot smuggle anything into
the next reader's table.
