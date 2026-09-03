# The Endpoint Contract

`useDataTable()` talks to one endpoint and expects one shape back. Everything else —
how the query is built, what a row contains, which filters exist — is the island's own.

## The Request

The composable sends a `GET` request to `dataUrl` with **every key of `defaults`** as a
query parameter, except those listed in `clientOnly`. Keys listed in `filterParams` travel
as `filter[key]`; the rest go bare. Booleans are sent as `1` and `0`.

```text
GET /islands/invoices/data?q=acme&status=open&sort=created_at&dir=desc&page=2&perPage=30
```

with `filterParams: ['status']`:

```text
GET /islands/invoices/data?q=acme&filter[status]=open&sort=created_at&dir=desc&page=2&perPage=30
```

Two headers accompany it: `Accept: application/json` and
`X-Requested-With: XMLHttpRequest`. Any extra header — a tenant, an API version — is added
through a [custom HTTP client](#the-http-client).

## The Response

```json
{
    "data": {
        "rows": [{ "id": 1, "number": "INV-1001" }],
        "meta": {
            "paginated": true,
            "total": 240,
            "page": 2,
            "perPage": 30,
            "lastPage": 8,
            "from": 31,
            "to": 60
        }
    }
}
```

The `data` envelope is required. Inside it:

| Key | Purpose |
| --- | --- |
| `rows` | The array the component iterates. Missing means `[]`. |
| `meta.paginated` | `false` hides the pagination bar entirely — for a list that answers in one go. |
| `meta.total`, `meta.from`, `meta.to` | Write the "31 – 60 of 240" line. |
| `meta.page`, `meta.lastPage` | Drive the page buttons and the jump-to-page select. |
| `meta.perPage` | Informational. The page *size* the component shows comes from its `perPage` prop, which is `state.perPage`. |

Anything else inside `data` — tab counts, group headers, aggregates, the list of
brands — reaches the component as `payload`. That is the place for everything the view
needs alongside the rows; it must never make a second request for it. See
[Tabs & Groups](/tabs-and-groups).

## Validating Input

Every parameter comes from the URL. A shared link, a bookmark, a hand-edited query string
can carry anything, and `sort` in particular goes straight into `orderBy`. Whitelist in
the query, and let a bad value fall back rather than fail:

```php
public const SORTABLE = ['number', 'customer', 'total', 'created_at'];

$sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';
$dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';
$perPage = PerPageEnum::sanitize((int) $request->query('perPage', 30));
$page = max(1, (int) $request->query('page', 1));
```

`PerPageEnum` ships the page sizes the `Pagination` component offers and a `sanitize()`
that falls back to its default for anything else — see [Configuration](/configuration#page-sizes).

The same values are validated a second time in the island's props class, so a deep link
opens the view the URL describes on the first frame — see the base package's
[Props](https://jonaaix.github.io/laravel-islands/props).

::: tip Guard the page number
When a filter shrinks the result below the current page, the request asks for a page
that no longer exists. Clamp `page` to `lastPage` in the query and return the clamped
value in `meta.page`; the component follows `meta`.
:::

## Authorization

The endpoint is directly reachable. Authorize inside the island controller before
answering, as described in the base package under
[Routes & Controllers](https://jonaaix.github.io/laravel-islands/routes-and-controllers).

## Errors

Any non-2xx response is treated as a failure: `error` turns `true`, the rows are cleared,
the shell shows its banner with a retry button. Validation errors are no exception — a
422 for a bad `sort` is a failure from the table's point of view, which is why the query
falls back instead of validating strictly.

## The HTTP Client

The composable never uses `fetch` directly. It goes through a small client that builds
the query string, sets the headers and throws on non-2xx responses:

```js
import { createHttpClient } from '@aaix/laravel-islands-datagrid/vue';

const http = createHttpClient({
    headers: { 'X-Tenant': tenantId },
    credentials: 'same-origin',
});

useDataTable(props.dataUrl, { defaults: DEFAULTS, http });
```

Anything with `get(url, { params }) → Promise<{ data }>` works as a client — an axios
instance qualifies as is.

For writes from the island — preferences, bulk actions — `sendJson(url, method, body)`
sends JSON with the CSRF token from the page's `csrf-token` meta tag, and throws with
`error.status` and `error.payload` on failure:

```js
import { sendJson } from '@aaix/laravel-islands-datagrid/vue';

await sendJson(props.preferencesUrl, 'PUT', { key: 'columns', value: state.cols });
```
