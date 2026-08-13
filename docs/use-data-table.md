# useDataTable

```js
import { useDataTable } from '@aaix/laravel-islands-datagrid/vue';

const table = useDataTable(dataUrl, options);
```

## Options

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `defaults` | `object` | `{}` | **Required.** Every state key with its default value. Defines what is sent to the server and what appears in the URL. |
| `initial` | `object` | `{}` | Server-provided starting state, merged over `defaults`. |
| `clientOnly` | `string[]` | `[]` | Keys kept in state and URL but never sent to the server. |
| `filterKeys` | `string[]` | `[]` | Keys counted by `activeFilterCount` and cleared by `resetFilters()`. |
| `searchKey` | `string` | `'q'` | State key driven by `onSearchInput`. |
| `searchDelay` | `number` | `350` | Debounce for `onSearchInput`, in milliseconds. |
| `http` | `object` | built-in fetch client | HTTP client. Anything exposing `get(url, { params })` that resolves to `{ data }`. |

## Returned state

| Name | Type | Description |
| --- | --- | --- |
| `state` | `reactive` | The live table state. Read it in templates, mutate it for domain rules. |
| `rows` | `ref<array>` | `data.rows` from the last successful response. |
| `meta` | `ref<object>` | `data.meta` from the last successful response. |
| `payload` | `ref<object>` | The whole `data` object — tab counts, groups, aggregates. |
| `loading` | `ref<boolean>` | A request is in flight. |
| `error` | `ref<boolean>` | The last request failed. |
| `activeFilterCount` | `computed<number>` | How many `filterKeys` differ from their default. |

## Returned methods

| Method | Description |
| --- | --- |
| `fetchData()` | Performs the request. Call once on mount. |
| `reload({ resetPage })` | Syncs the URL and refetches. Pass `resetPage: true` after changing a filter. |
| `onSearchInput(value)` | Writes to `searchKey` and reloads after the debounce. |
| `clearSearch()` | Clears `searchKey` immediately, without waiting for the debounce. |
| `setFilter(key, value)` | Sets a key and reloads from page one. |
| `resetFilters(keys?)` | Restores `filterKeys` (or the given keys) to their defaults. Reloads only if something changed. |
| `setSort(field)` | Sorts by `field`; toggles `asc`/`desc` when already sorted by it. |
| `goToPage(page)` | Changes the page and reloads. |
| `setPerPage(perPage)` | Changes page size and reloads from page one. |

## Behaviour worth knowing

**Stale responses are discarded.** Every request carries an id; a response whose
id is no longer current is dropped. Typing quickly can never leave an older
result on screen.

**The URL carries only what differs.** A key equal to its default is omitted, so
a pristine table has a clean URL and `initial` can restore any state from a
shared link. Booleans are written as `1` and `0`.

**Errors keep the shell.** On failure `rows` is emptied and `error` is set; the
toolbar and pagination stay mounted, so a retry never remounts the page.
