# Getting Started

## Requirements

- PHP 8.3+
- Laravel 12 or 13
- Vue 3.4+ and Tailwind CSS 4

Nothing else. The package ships its own fetch-based HTTP client, so there is no
axios to install and no global to configure.

It builds on [`aaix/laravel-islands`](https://github.com/jonaaix/laravel-islands)
and takes its generic controls from there — the field frame behind `Combobox`, the
round buttons in the toolbar, the press feedback the stepper shares. Installing
this package brings it along; giving the frontend both aliases is part of the
wiring below. The translator, on the other hand, stays optional — see
[Translations and locale](#translations-and-locale).

## Installation

```bash
composer require aaix/laravel-islands-datagrid
```

The service provider is discovered automatically.

## Wiring the frontend

The package ships plain Vue single-file components — no build step of its own.
Point Vite at them:

```js
// vite.config.js
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    resolve: {
        alias: {
            '@aaix/laravel-islands-datagrid': fileURLToPath(
                new URL('./vendor/aaix/laravel-islands-datagrid/resources/js', import.meta.url),
            ),
            '@aaix/laravel-islands': fileURLToPath(
                new URL('./vendor/aaix/laravel-islands/resources/js', import.meta.url),
            ),
        },
    },
});
```

Then let Tailwind scan the package, or its utility classes are dropped from the
build:

```css
@source '../vendor/aaix/laravel-islands-datagrid/resources/js/**/*';
```

::: warning
Missing the `@source` line is the one failure that looks like a layout bug
rather than a configuration bug: the table renders, but padding and widths are
subtly wrong because those classes were never generated.
:::

## The endpoint

A table talks to one JSON endpoint. It answers with rows and pagination meta:

```json
{
    "data": {
        "rows": [{ "id": 1, "name": "…" }],
        "meta": {
            "paginated": true,
            "total": 240,
            "page": 1,
            "perPage": 30,
            "lastPage": 8,
            "from": 1,
            "to": 30
        }
    }
}
```

Every key you declared in `defaults` arrives as a query parameter, so the
controller reads `q`, `sort`, `dir`, `page`, `perPage` and your own filters
directly off the request.

Anything else you add inside `data` — tab counts, group headers, aggregates —
is exposed to the island as `payload`.

## The HTTP client

Requests go through a small fetch client the package brings along. It sends
`Accept: application/json` and `X-Requested-With: XMLHttpRequest` — the latter
makes Laravel answer an expired session with `401 JSON` instead of redirecting
to a login page — with `credentials: 'same-origin'` so the session cookie
travels.

It also throws on any non-2xx response. That matters: `fetch` on its own
rejects only on network failure, so a `403` carrying valid JSON would otherwise
be handed to the table as data.

To add headers, build your own:

```js
import { createHttpClient } from '@aaix/laravel-islands-datagrid/vue';

const http = createHttpClient({ headers: { 'X-Tenant': tenantId } });

useDataTable(dataUrl, { defaults: DEFAULTS, http });
```

The `http` option accepts anything exposing `get(url, { params })` that
resolves to `{ data }` — axios included, if an application already has one
configured.

## Translations and locale

The package renders a handful of strings of its own — `Retry`, `Clear search`,
and the pagination labels — and formats totals with `toLocaleString`. Out of the
box it uses the English source strings and the `en` locale, which is a working
default, not an error.

To hook it into your application's translations, hand it a translator in the
setup of the component that renders the table:

```js
import { provideDatagrid } from '@aaix/laravel-islands-datagrid/vue';

provideDatagrid({ t, locale });
```

`t` is any `(key, replace) => string`. Under laravel-islands that is
`useTranslations().t`; anywhere else, whatever your i18n layer provides.

## Next

Continue with [Building a Table](/building-a-table).
