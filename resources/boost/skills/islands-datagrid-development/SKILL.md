---
name: islands-datagrid-development
description: Implement a data table with aaix/laravel-islands-datagrid — the JSON endpoint contract, the useDataTable composable and the DataTable shell with its toolbar components. Use whenever a list view is added or an existing table gains search, filters, sorting, grouping, tabs or pagination.
---

# Implementing a Data Table

Two parts: an endpoint answering with rows and meta, and a Vue component
rendering it. How the surrounding page is routed and rendered is the host
application's business, not this package's.

## Endpoint

`useDataTable` sends every key of `defaults` as a query parameter and expects:

```json
{ "data": {
    "rows": [{ "id": 1 }],
    "meta": { "paginated": true, "total": 240, "page": 1, "perPage": 30, "lastPage": 8, "from": 1, "to": 30 }
} }
```

The `data` envelope is required. `paginated: false` hides the pagination bar,
`total`/`from`/`to` write the "1 – 30 of 240" line, `page` and `lastPage` drive
the page buttons; the page *size* comes from the `perPage` prop, not from
`meta`. Anything else inside `data` — tab counts, groups, aggregates — reaches
the component as `payload`; never make a second request.

Validate what the table sends, it comes from the URL:

```php
$sort = in_array($request->get('sort'), self::SORTABLE, true) ? $request->get('sort') : 'created_at';
$dir = $request->get('dir') === 'asc' ? 'asc' : 'desc';
$perPage = max(10, min(200, (int) $request->integer('perPage', 30)));
```

An unchecked `sort` goes straight into `orderBy`. Authorize on the endpoint
itself — it is directly reachable.

## Component

```vue
<script setup>
import { onMounted } from 'vue';
import { DataTable, SearchInput, useDataTable } from '@aaix/laravel-islands-datagrid/vue';
import InvoiceRow from './components/InvoiceRow.vue';

const props = defineProps({ dataUrl: String, initial: Object });

const DEFAULTS = { q: '', status: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30 };

const { state, rows, meta, loading, error, onSearchInput, clearSearch, setFilter, setSort, goToPage, setPerPage, reload, fetchData } =
    useDataTable(props.dataUrl, { defaults: DEFAULTS, initial: props.initial, filterKeys: ['status'] });

onMounted(() => fetchData());
</script>

<template>
    <DataTable
        :rows="rows" :meta="meta" :per-page="state.perPage" :col-count="4"
        :loading="loading" :error="error" error-message="Could not load invoices"
        @retry="reload()" @page-change="goToPage" @per-page-change="setPerPage"
    >
        <template #toolbar>
            <SearchInput :model-value="state.q" placeholder="Search…"
                @update:model-value="onSearchInput" @clear="clearSearch()" />
        </template>

        <template #head>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Number</th>
            <!-- one <th> per column; the <tr> is supplied -->
        </template>

        <InvoiceRow v-for="row in rows" :key="row.id" :row="row" />

        <template #empty><p>No invoices found</p></template>
    </DataTable>
</template>
```

`DEFAULTS` is the contract — declare the full shape up front; a key added to
`state` later is missing from the request and the URL. `<DataTable>` is the
card only: page headers, tabs and side panels go around it. The row component's
root is a `<tr>`.

## API

**`useDataTable(dataUrl, options)`** — options: `defaults` (required), `initial`,
`clientOnly` (in state and URL, never sent), `filterKeys` (for
`activeFilterCount` / `resetFilters`), `filterParams` (sent as `filter[key]`
instead of a bare parameter), `searchKey` (`'q'`), `searchDelay` (`350`), `http`.

Returns `state`, `rows`, `meta`, `payload`, `loading`, `error`,
`activeFilterCount`, `fetchData`, `reload`, `syncUrl`, `onSearchInput`,
`clearSearch`, `setFilter`, `resetFilters`, `setSort`, `goToPage`, `setPerPage`.

`syncUrl()` writes state into the address bar without fetching — that is how a
client-only change (columns, card size) becomes deep-linkable.

**`DataTable`** — props `rows`, `meta`, `perPage`, `perPageOptions`, `colCount`,
`loading`, `error`, `errorMessage`, `skeletonRows`, `skeletonCellClass`,
`skeletonBarClass`, `floatingToolbar`, `floatingFooter`, `floatTopOffset`
(`12`), `floatBottomOffset` (`12`), `mode` (`'table'` | `'cards'`, default
`'table'`), `cardsMinWidth` (`'260px'`), `cardsGap` (`'0.75rem'`),
`cardSkeletonHeight` (`'240px'`), `cardSkeletonCount` (`8`); emits `retry`,
`page-change`, `per-page-change`; slots `toolbar`, `head`, default, `cards`,
`empty`. Extra classes land on the card. Set `--table-toolbar-h` on an
ancestor to pin the toolbar height.

**Cards mode:** setting `mode="cards"` renders a responsive auto-fit grid from
the `#cards` slot instead of the `<table>`. Toolbar, error banner and
pagination stay the same. The `#head` and default slots are ignored in that
mode; sorting moves into the toolbar via `SortMenu` (below).

`floatingToolbar` / `floatingFooter` lift toolbar and pagination into glass
pills once they would leave the screen, while the page keeps its own scroll.
Use them instead of turning the table into an inner scroll container.

**`SearchInput`** — `modelValue`, `placeholder`, `clearLabel`; emits
`update:modelValue` (→ `onSearchInput`) and `clear` (→ `clearSearch`).

**`Combobox`** — `modelValue`, `options` (`{value: label}` or `[{value, label}]`),
`placeholder`, `searchPlaceholder`, `allLabel`, `emptyLabel`, `emptyValue`,
`searchValues`, `clearOption`, `maxOptions` (`60`, zero shows all),
`keepAncestors`, `menuWidth` (`288`), `menuHeight` (`240`); slots `option` and
`selected`. For long lists pass `fetchOptions: (query) => Promise<options>` with
`fetchDelay` and `loadingLabel` — then `options` holds only the preloaded first
page and the server answers each search. Pair it with `selectedLabel`, or a
deep-linked selection outside that page shows the placeholder.

**`variant` decides the look, and the default is a form field.** `field` stays
neutral, `filter` and `filter-card` tint a set value. A picker inside a form
must not look like an active filter, so only filters opt in.

**Also exported, before building any of it by hand:**

- **`Pagination`** — the bar `DataTable` already renders; standalone only outside a table.
- **`FilterPanel`** — the panel beside the table, with its own dock behaviour.
- **`TreeSelect`** — a hierarchy with a searchable path, one fetch per URL, cached.
- **`MultiSelect`** — several values from one list.
- **`OptionStrip`** — a micro switcher: one-of-n, or `multiple` for per-option
  on/off; `variant` `pills` (a row of switches) or `segmented` (one question,
  n answers), `clearable` to let go of the chosen one.
- **`ColumnPicker`** — which columns are visible, plus reset.
- **`SortButton`** — the header-cell sort control. Props `field` (required),
  `label` (required), `icon`, `short`, `sort`, `dir`; emits `sort` with the
  field name (parent flips direction). Same emit contract as `SortMenu`, so
  header buttons and a toolbar menu share one handler. Reads icon names via
  `provideIcons()` from `@aaix/laravel-islands`.
- **`ViewModeToggle`** — segmented control between `'table'` and `'cards'`;
  props `modelValue`, `labels`; emits `update:modelValue`.
- **`SortMenu`** — compact sort dropdown for cards mode (or anywhere `<th>`s
  are too dense); props `options` (`[{field, label}]`), `sort`, `dir`,
  `label`; emits `sort` (same contract as header SortButtons — parent handles
  direction).
- **`GridCard`**, **`GridCardMedia`** — building blocks for the `#cards`
  slot. `GridCard` slots: `media`, `header`, default, `footer`; props `href`,
  `active`, `interactive`. `GridCardMedia` gives a `ratio` frame, defaulting
  to `'3 / 2'`.
- **`useAutoCardMode({ state, key, breakpoint, cardsValue, tableValue })`** —
  turns on `cards` under a `matchMedia` breakpoint (default
  `'(max-width: 767px)'`) the first time a reader lands, stepping back once
  they pick a mode themselves. A `?mode=…` in the URL also counts as a choice.
- **`ViewProfileMenu`** with **`useViewProfiles({ state, defaults, keys, storeUrl, profileUrl })`** — saved views, sharing included.
- **`SelectionBox`** with **`useSelection(rows, { key: 'id' })`** — row selection across pages and bulk actions.
- **`createHttpClient` / `httpClient` / `sendJson`** — the fetch layer with its non-2xx throw.

**`provideDatagrid({ t, locale })`** — optional; hands the package your
translator. Without it, English source strings and locale `en`.

## Saved views, on the PHP side

The three endpoints behind `ViewProfileMenu` ship with the package. Use the
trait instead of writing them:

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

The trait supplies `storeViewProfile`, `updateViewProfile` and
`destroyViewProfile`; point three routes at them and override
`authorizeViewProfiles()`. Ownership, the per-user limit and the public
reference are the store's business.

A `ViewProfileSchema` declares what a saved payload may carry — `text`, `id`,
`flag`, `tristate`, `date`, `choice`, `keyList`, each with its allowed values —
and `sanitize()` drops the rest, so a shared view cannot smuggle anything into
the next reader's table. Declare it there, not in the controller.

## Harder cases

- **Tabs** are a filter with a different shape: set `state.tab`, `state.page = 1`, then `reload()`.
- **Groups** come from `payload.groups` / `payload.grouped`; emit the header `<tr>` between rows in the default slot.
- **Mutually exclusive filters**: mutate `state` directly, then `reload({ resetPage: true })` **once**, so one request goes out.
- **View toggles** that must not reach the server go in `defaults` *and* `clientOnly`.

## Pitfalls

- **`emptyValue` must match the filter's default.** Defaults to `0`; pass `""`
  for string filters, or clearing writes `0` into state and the URL.
- **`colCount` must match the number of `<th>`**, conditional ones included — it
  drives the skeleton and empty-state `colspan`.
- **A filter change resets to page 1.** `setFilter` does it; when mutating
  `state` yourself, pass `reload({ resetPage: true })`.
- **Register the package with Tailwind** via `@source`, or its utility classes
  are dropped and the table renders with subtly wrong padding — looks like a
  layout bug, is a config bug.
- **Never call `fetch` directly.** The composable owns fetching, including the
  race guard and the non-2xx throw that bare `fetch` lacks. Custom headers:
  `createHttpClient({ headers })` as `options.http`.
- **Verify with content, not an empty table.** Clear buttons, badges and empty
  states only exist in the DOM once there is state.
- **A control in one table but not the other is a bug in waiting.** Move it into
  the package instead of preserving the difference.
- **`filterParams` decides how a filter travels.** Listed keys go out as
  `filter[key]=value` and land in the URL that way; without it the key is sent
  bare. Pick one shape per table and declare it up front.
