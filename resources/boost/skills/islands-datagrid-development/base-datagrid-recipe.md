---
title: Base Datagrid Recipe
scope: aaix/laravel-islands-datagrid
---

# A Good Base Datagrid

The shape of a list view that carries its own weight — search, sort, filters,
tabs, pagination, column picker, saved views, card mode, empty state, skeleton.
Not a template to paste; a checklist of the pieces and the order they belong in.
Consult the SKILL, `building-a-table.md` and the helpers index for how each
piece works.

Use `Records` as the placeholder feature name below.

## Files

```text
app/Islands/Records/
├── Records.island.vue
├── RecordsIslandController.php   uses HandlesViewProfiles
├── RecordsProps.php              validates every URL-supplied value
├── Routes.php                    data · preferences · profiles.store · profiles.update
├── Queries/RecordsListQuery.php  SORTABLE · TABS · applyTabScope/Filters/Search
├── Presenters/RecordRowPresenter.php   the wire shape a row draws
├── State/RecordsPreferences.php  per-user allowlisted view state
├── State/RecordsViewProfiles.php ViewProfileStore + ViewProfileSchema
├── Support/{Columns,Sorts,Preferences}.js
└── Components/RecordRow.vue      root <tr>
```

Skip a folder when its role never grows past one file.

## Backend, the pieces

- **Controller.** `use HandlesViewProfiles`. One `authorizeAccess()` guard called
  from every action, including `authorizeViewProfiles()`. `data()` returns
  `['data' => $this->query->data($request)]`. `updatePreference()` validates
  `key ∈ Preferences::ALLOWED` and writes through `UserSetting::set()`.
- **Query.** Owns the whitelists: `const SORTABLE`, `const TABS`. `data()` validates
  `tab`/`sort`/`dir`/`perPage`/`page` against them, then calls
  `applyTabScope()`, `applyFilters()`, `applySearch()`, orders and paginates,
  guards `page > lastPage`, and returns `{ rows, meta, tabs, payload… }`. Tab
  counts come from **one** aggregate query, not one-per-tab.
- **Presenter.** Turns a model into what the wire carries — labels, colours,
  verdicts already resolved, so the row stays dumb.
- **Props.** Validates the same URL values a second time so a deep link opens the
  same view the URL describes. `TAB_KEYS`, `SORT_KEYS`, `PER_PAGE_OPTIONS` are
  class constants shared with the query. Returns
  `dataUrl`, `preferencesUrl`, `profilesUrl`, `profileUrl`, `profiles`,
  `activeProfile`, `preferences`, `tabs`, `filters`, `sortOptions`, `initial`.
- **State.** `Preferences` allowlists which per-user keys the frontend may
  write. `ViewProfiles` declares a `ViewProfileSchema` — `text`, `id`, `flag`,
  `choice`, `date`, `keyList` — so a shared view cannot smuggle anything into
  the next reader's table.

Miss the schema and a saved view becomes a stored-XSS shape. Not optional.

## Frontend

### DEFAULTS — the whole contract

```js
const DEFAULTS = {
    // Table state
    tab: 'active', q: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30,
    // Filters — one key per URL parameter
    status: '', category: 0, created_from: '', created_until: '',
    // View-only state (kept in URL, never sent)
    cols: DEFAULT_COLUMN_KEYS.join(','), mode: 'table', view: '',
};

const FILTER_PARAMS = ['q', 'status', 'category', 'created_from', 'created_until'];
const CLIENT_ONLY   = ['cols', 'mode', 'view'];
```

- **Never add a key to `state` afterwards** — it disappears from the request and
  the URL.
- **Pick one URL shape per table.** `filterParams` sends listed keys as
  `filter[key]=value`; unlisted keys go bare. Mixing them silently is the most
  common cause of "the deep link opens the wrong page."
- **`filterKeys` is the set counted by `activeFilterCount`** and cleared by
  `resetFilters()` — filters only; `sort`/`page`/`perPage` never.
- **`clientOnly` covers columns, view mode, expanded rows and the saved-view
  ref.** A key must appear in `defaults` *and* in `clientOnly`, or the endpoint
  sees it and the URL loses it.

### Wiring

```js
const table = useDataTable(props.dataUrl, {
    defaults: DEFAULTS,
    initial: props.initial,
    filterParams: FILTER_PARAMS,
    filterKeys: ['status', 'category', 'created_from', 'created_until'],
    clientOnly: CLIENT_ONLY,
});
```

Providers at the island root, once: `provideIcons(ICONS)`,
`provideDatagrid({ t, locale })`, `provideConfirm()`, `provideToasts()`.
Mount `<ConfirmHost />` and `<ToastHost />` in the template.

### Saved views

```js
const views = useViewProfiles({
    state, defaults: DEFAULTS,
    keys: [...FILTER_PARAMS, 'sort', 'dir', 'perPage', 'cols'],
    storeUrl: props.profilesUrl,
    profileUrl: props.profileUrl,
    initial: props.profiles,
    shared: props.activeProfile,
    plain: { cols: BASELINE_COLUMNS },   // reader's own baseline, not system default
    apply: () => reload({ resetPage: true }),
    onError: (m) => toast.danger(m || t('Could not save this view')),
});
```

`plain` is what a "reset view" lands on — a remembered column choice, not the
package's neutral defaults.

### Template shape

Around the `<DataTable>`: page header, `<Tabs>` (tab is a filter, not a column),
`<FilterPanel>` beside it via `useFilterPanelDock`.

**Layout conventions — the same across every list in the app:**

- **Search is always there**, first in the toolbar. No feature turns it off,
  even if the endpoint ignores an empty `q`.
- **Standard filters live in the toolbar** — the two to four that almost every
  reader reaches for, rendered as `Combobox`es right next to the search. They
  reflect the way the list is scanned day-to-day.
- **Advanced / dimensional / rarely-used filters live in the `FilterPanel`** —
  date ranges, count thresholds, cross-cutting flags, everything that would
  make the toolbar too dense. The toolbar carries a filter-toggle
  `IconButton` with an `activeFilterCount` badge to open the panel.
- **The `FilterPanel` docks on the right** of the `<DataTable>` (the table
  comes first in the flex row, the panel after it), so the toolbar and its
  primary filters stay on the reader's natural left. `useFilterPanelDock` keeps
  it docked while there is room and lifts it into an overlay otherwise.
- **Sort menu, view profiles, column picker, filter toggle, view-mode strip
  cluster on the right** of the toolbar, in that order — so they land in the
  same spot in every table and a reader's muscle memory carries over.

Toolbar slot, in order:
`SearchInput` · filter `Combobox`es · `SortMenu` (cards mode only) ·
`ViewProfileMenu` · `ColumnPicker` (table mode only) · filter-toggle
`IconButton` with an `activeFilterCount` badge · `OptionStrip` for
table/cards mode.

Head slot: one `<th>` per visible column; sortable ones wrap `<SortButton>`.

Body: `<RecordRow v-for="row in rows" :row="row" :columns="visibleColumns" />`.

`#cards`, `#empty`, `#error-message` slots. `col-count` **must** match the
visible-column count including conditional ones — it drives skeleton and empty
`colspan`.

### Small pieces the template refers to

- `visibleColumns` derived from `state.cols` via `resolveColumnKeys()` against
  the column registry from `Support/Columns.js`.
- `colCount` = sum of `column.span` over visibleColumns.
- `TAB_ITEMS` built from `props.tabs` counts.
- `MODE_OPTIONS` = `[{ value: 'table', icon: IconModeTable }, { value: 'cards',
  icon: IconModeCards }]` for `<OptionStrip variant="segmented">`.
- `setTab(tab)`: sets `state.tab`, resets `state.page = 1`, then `reload()`.
- `setColumns(keys)`: writes `state.cols`, `syncUrl()`, `sendJson(preferencesUrl,
  { key: 'columns', value: state.cols })`.
- `setMode(mode)`: same shape, key `'mode'`.
- `onMounted(() => fetchData())`.

## Rules of thumb

- **Every URL value is validated twice** — once in `Props::build()` for the
  initial state, once in the query for each request. The two lists have to
  name the same options.
- **A filter has four homes** to be complete: `DEFAULTS`, `filterKeys`,
  `filterParams` (if it travels as `filter[]`), and a validated `where()` in
  the query. Miss one and it stops working; miss another and it works too much.
- **Tabs are a filter with a different shape.** Mutate `state.tab`, reset
  `state.page`, then `reload()`.
- **Card mode needs `SortMenu`** in the toolbar — header `<th>`s are ignored
  there.
- **Preferences persist per user, not per browser.** `localStorage` may cache,
  the server owns the truth (`preferencesUrl` in the props).
- **Ship the empty state and the skeleton on day one.** They are not polish; a
  filter that matched nothing needs to say so.

## What already lives in the package

Do not rewrite these — see `helpers-index.md` for the full inventory:

`DataTable`, `useDataTable`, `SearchInput`, `Combobox`/`MultiSelect`/`TreeSelect`,
`OptionStrip`, `SortButton`/`SortMenu`, `ColumnPicker`, `FilterPanel` +
`useFilterPanelDock`, `ViewProfileMenu` + `useViewProfiles`, `useAutoMobileMode`,
`GridCard`/`GridCardMedia`, `SelectionBox` + `useSelection`, `httpClient` /
`sendJson`; PHP: `HandlesViewProfiles`, `ViewProfileStore`, `ViewProfileSchema`.
