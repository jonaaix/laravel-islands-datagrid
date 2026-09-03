# Table State

`useDataTable()` turns one `defaults` object into the request, the reactive state, the
URL and the history.

```js
const DEFAULTS = {
    q: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30,   // table state
    status: '', brand: 0,                                           // filters
    cols: 'number,customer,total', mode: 'table',                   // view-only
};

const table = useDataTable(props.dataUrl, {
    defaults: DEFAULTS,
    initial: props.initial,
    filterKeys: ['status', 'brand'],
    clientOnly: ['cols', 'mode'],
});
```

`DEFAULTS` is the contract: a key added to `state` later is missing from the request and
the URL. `page`, `sort`, `dir` and `perPage` are fixed names.

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `defaults` | `{}` | Every state key with its default. |
| `initial` | `{}` | The server's starting state, merged over `defaults`. |
| `filterKeys` | `[]` | Keys counted by `activeFilterCount` and cleared by `resetFilters()`. |
| `filterParams` | `[]` | Keys sent as `filter[key]` instead of bare. |
| `clientOnly` | `[]` | Keys kept in state and URL but never sent: columns, view mode, the saved-view ref. |
| `searchKey`, `searchDelay` | `'q'`, `350` | The search key and its debounce. |
| `http` | built-in | A client with `get(url, { params })`. |

## Returns

| | Meaning |
| --- | --- |
| `state` | The reactive state. |
| `rows`, `meta`, `payload` | The last response: rows, meta, and the whole `data` object. |
| `loading`, `error` | Request in flight; last request failed. |
| `activeFilterCount` | How many `filterKeys` differ from their default. |
| `fetchData()` | Sends the request. **Call it on mount** — nothing fetches by itself. |
| `reload({ resetPage, push })` | Fetch again, optionally from page 1, optionally without a history entry. |
| `syncUrl()` | Write the state to the address bar without fetching — for client-only changes. |
| `onSearchInput(value)`, `clearSearch()` | Debounced search; both reset to page 1. |
| `setFilter(key, value)`, `resetFilters()` | Change one filter, or restore all; reset to page 1. |
| `setSort(field)` | Same field toggles direction; a new field sorts descending. |
| `goToPage(page)`, `setPerPage(value)` | Pagination. |

## Behaviour

- **URL:** only keys that differ from their default are written. A shared link opens the
  same view; on first mount the query string beats `initial`.
- **History:** `reload()` pushes an entry, typing in the search replaces it, and the back
  button refetches.
- **Race guard:** a response that arrives after a newer request was sent is discarded.
- **Several keys at once:** mutate `state` directly, then `reload({ resetPage: true })`
  once — three `setFilter()` calls would send three requests.

## Tabs and Groups

A tab is a filter with a different shape: a key in `defaults`, switched by writing
`state.tab` and reloading. The counts come back in `payload` from one aggregate query:

```js
function setTab(tab) {
    state.tab = tab;
    reload({ resetPage: true });
}
```

Group headers are rows the island draws in the default slot from `payload.groups` — a
`<tr>` with a `colspan` before each group's rows.
