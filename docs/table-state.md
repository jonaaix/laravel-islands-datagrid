# Table State

`useDataTable()` turns one `defaults` object into everything a list needs: the request,
the reactive state, the URL, the history and the search debounce. This page is about
that object and what follows from it.

## Declaring the State

```js
const DEFAULTS = {
    // Table state
    q: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30,
    // Filters — one key per URL parameter
    status: '', brand: 0, created_from: '',
    // View-only state — in the URL, never sent
    cols: 'number,customer,total', mode: 'table',
};

const table = useDataTable(props.dataUrl, {
    defaults: DEFAULTS,
    initial: props.initial,
    filterKeys: ['status', 'brand', 'created_from'],
    filterParams: ['status', 'brand', 'created_from'],
    clientOnly: ['cols', 'mode'],
});
```

`DEFAULTS` is the contract. Declare the full shape up front: a key added to `state`
later is missing from the request and from the URL.

| Option | Default | Purpose |
| --- | --- | --- |
| `defaults` | `{}` | Every state key with its default. Decides what is sent and what is mirrored to the URL. |
| `initial` | `{}` | The server's starting state, merged over `defaults` — what the props class validated from the URL. |
| `filterKeys` | `[]` | The keys counted by `activeFilterCount` and cleared by `resetFilters()`. Filters only — never `sort`, `page` or `perPage`. |
| `filterParams` | `[]` | Keys that travel as `filter[key]` in the request and the URL. Others go bare. |
| `clientOnly` | `[]` | Keys kept in state and URL but never sent. Columns, view mode, an expanded row, the saved-view ref. |
| `searchKey` | `'q'` | The key `onSearchInput()` writes. |
| `searchDelay` | `350` | Debounce for the search, in milliseconds. |
| `http` | built-in | A client with `get(url, { params })`. See [The HTTP Client](/endpoint#the-http-client). |

Four names are fixed: `page`, `sort`, `dir` and `perPage`. The helpers below read and
write them by name.

::: warning A filter has four homes
`DEFAULTS`, `filterKeys`, `filterParams` if it travels as `filter[]`, and a validated
`where()` in the query. Miss one and it stops working; miss another and it works too
much.
:::

## What It Returns

| | Meaning |
| --- | --- |
| `state` | The reactive state object. Read it in the template; write it directly only when a helper below does not fit. |
| `rows` | The `rows` array of the last response. |
| `meta` | The `meta` object of the last response. |
| `payload` | The whole `data` object — tab counts, groups, aggregates. |
| `loading` | `true` while a request is in flight. |
| `error` | `true` after a failed request, until the next successful one. |
| `activeFilterCount` | How many `filterKeys` differ from their default. |

| Method | Effect |
| --- | --- |
| `fetchData()` | Sends the request for the current state. **Call it on mount** — the composable does not fetch by itself. |
| `reload({ resetPage, push })` | Fetches again; `resetPage: true` goes back to page 1 first, `push: false` replaces the history entry instead of adding one. |
| `syncUrl({ push })` | Writes the state into the address bar without fetching — how a client-only change becomes a deep link. |
| `onSearchInput(value)` | Writes the search key, debounces, resets to page 1, fetches without a history entry. |
| `clearSearch()` | Empties the search and fetches. |
| `setFilter(key, value)` | Writes one key, resets to page 1, fetches. |
| `resetFilters()` | Restores every `filterKeys` default; fetches only if something changed. |
| `setSort(field)` | Same field toggles `dir`; a new field sorts descending. Resets to page 1. |
| `goToPage(page)` | Fetches that page. |
| `setPerPage(value)` | Changes the page size and resets to page 1. |

## The URL

After every fetch, the state is written to the query string — but only the keys that
differ from their default. A pristine list has a clean URL; a filtered one carries
exactly the filter:

```text
/admin/invoices?status=open&sort=total&dir=desc&page=3
```

Booleans are written as `1` and `0`. Keys in `filterParams` appear as `filter[status]`,
with the brackets left readable.

On the first mount, a non-empty query string is applied over the state — so a shared
link beats `initial`, and both beat `defaults`. Numbers are coerced from the string,
booleans compare against `'1'`.

The back and forward buttons work: a `popstate` listener reads the query string again
and fetches. `reload()` pushes a history entry by default; typing in the search replaces
the current one, so a search does not leave one entry per keystroke.

## Requests in Flight

Every fetch carries a running number. When a slow response arrives after a newer request
was sent, it is discarded whole — rows, meta and payload — so a fast typist never sees an
older result land on top of a newer one. Requests are not aborted; the guard is what makes
them safe.

While a request runs with rows already on screen, the rows stay and the shell shows a
thin progress bar instead of a skeleton. The skeleton appears only when there is nothing
to keep.

## Client-Only State

A view toggle that the server does not care about — the visible columns, the card size,
table versus cards — goes in `defaults` *and* in `clientOnly`. It then lives in the state
and the URL like everything else, but the endpoint never sees it:

```js
function setColumns(keys) {
    state.cols = keys.join(',');
    syncUrl();
    sendJson(props.preferencesUrl, 'PUT', { key: 'columns', value: state.cols });
}
```

The server owns the user's preference; `syncUrl()` makes the current view linkable.

## Changing Several Keys at Once

Mutually exclusive filters, a tab that also resets a sort, a preset that sets three keys —
mutate `state` directly, then reload **once**:

```js
function applyPreset(preset) {
    state.status = preset.status;
    state.created_from = preset.from;
    state.sort = 'created_at';
    reload({ resetPage: true });
}
```

Calling `setFilter()` three times would send three requests, two of which the race
guard throws away.
