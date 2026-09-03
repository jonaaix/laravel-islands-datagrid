# The Endpoint

`useDataTable()` talks to one endpoint and expects one shape back.

## Request

A `GET` to `dataUrl` with **every key of `defaults`** as a query parameter, except those in
`clientOnly`. Keys in `filterParams` travel as `filter[key]`; the rest go bare. Booleans
are `1` and `0`.

```text
GET /islands/invoices/data?q=acme&status=open&sort=created_at&dir=desc&page=2&perPage=30
```

## Response

```json
{
    "data": {
        "rows": [{ "id": 1, "number": "INV-1001" }],
        "meta": { "paginated": true, "total": 240, "page": 2, "perPage": 30, "lastPage": 8, "from": 31, "to": 60 }
    }
}
```

| Key | Purpose |
| --- | --- |
| `rows` | The array the component iterates. |
| `meta.paginated` | `false` hides the pagination bar. |
| `meta.total`, `from`, `to` | The "31 – 60 of 240" line. |
| `meta.page`, `lastPage` | The page buttons. The page *size* comes from the component's `perPage` prop. |

Anything else inside `data` — tab counts, group headers, aggregates — reaches the
component as `payload`. Never make a second request for it.

## Validation

Every parameter comes from the URL, and `sort` goes straight into `orderBy`. Whitelist in
the query and fall back rather than fail:

```php
$sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';
$dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';
$perPage = PerPageEnum::sanitize((int) $request->query('perPage', 30));
```

Any non-2xx response counts as a failure: the rows are cleared and the shell shows its
banner with a retry button. Authorize inside the island controller — the endpoint is
directly reachable.

## HTTP Client

The composable uses a small client that sets the headers and throws on non-2xx. For
extra headers, pass your own as `http` — an axios instance works as is:

```js
useDataTable(props.dataUrl, { defaults, http: createHttpClient({ headers: { 'X-Tenant': tenantId } }) });
```

For writes from the island, `sendJson(url, method, body)` sends JSON with the CSRF token
from the page's `csrf-token` meta tag.
