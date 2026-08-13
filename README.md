<p align="center">
  <a href="https://github.com/jonaaix/laravel-islands-datagrid">
    <img src="https://raw.githubusercontent.com/jonaaix/laravel-islands-datagrid/main/docs/public/logo.svg" alt="Laravel Islands DataGrid Logo" width="120">
  </a>
</p>

<h1 align="center">Laravel Islands DataGrid</h1>

<p align="center">
Server-driven data tables for Laravel Islands — framework-agnostic core, with one composable for state and one shell for chrome, so every table shares the same foundation.
</p>

<p align="center">
  <a href="https://packagist.org/packages/aaix/laravel-islands-datagrid"><img src="https://img.shields.io/packagist/v/aaix/laravel-islands-datagrid.svg?style=flat-square" alt="Latest Version on Packagist"></a>
  <a href="https://packagist.org/packages/aaix/laravel-islands-datagrid"><img src="https://img.shields.io/packagist/dt/aaix/laravel-islands-datagrid.svg?style=flat-square" alt="Total Downloads"></a>
  <a href="https://github.com/jonaaix/laravel-islands-datagrid/actions/workflows/tests.yml"><img src="https://img.shields.io/github/actions/workflow/status/jonaaix/laravel-islands-datagrid/tests.yml?branch=main&label=tests&style=flat-square" alt="GitHub Actions"></a>
  <a href="https://github.com/jonaaix/laravel-islands-datagrid/blob/main/LICENSE.md"><img src="https://img.shields.io/packagist/l/aaix/laravel-islands-datagrid.svg?style=flat-square" alt="License"></a>
</p>

---

A server-driven data table for Laravel Islands. One composable owns the table
state, one shell component owns the chrome, so every table in an application
shares the same foundation instead of copying it.

It imports nothing beyond its host framework. It pairs naturally with
[`aaix/laravel-islands`](https://github.com/jonaaix/laravel-islands) — hand it
that package's translator and it speaks your application's language — but the
page around the table can just as well be Blade, Filament or Inertia.

## Adapters

The core is framework-agnostic. Today the package ships a Vue adapter — that
is what every example below uses.

| Framework | Status                            | Entry point                            |
| --------- | --------------------------------- | -------------------------------------- |
| Vue 3     | ✅ Shipped                        | `@aaix/laravel-islands-datagrid/vue`   |
| React     | ⬜ Not yet — contributions welcome | —                                      |
| Others    | ⬜ Not yet — contributions welcome | —                                      |

The adapter surface is contained: a state layer with the shape of
`useDataTable`, and a shell component that renders the same slots (`toolbar`,
`head`, rows, `empty`) and consumes the same endpoint contract. Open an issue
if you want to work on one.

## Concept

- **`useDataTable`** — fetching, sorting, filtering, pagination, debounced
  search and query-string sync. A table is described entirely by a `defaults`
  object.
- **`<DataTable>`** — the card: toolbar, error banner, `<table>` scaffold,
  skeleton, empty state, pagination and the refresh bar. Columns and rows stay
  in your island, where they belong.
- **Everything else stays yours.** Page headers, tabs and side panels live in
  the island; the package never dictates page layout.

## Installation

```bash
composer require aaix/laravel-islands-datagrid
```

Point Vite at the package and let Tailwind scan it:

```js
// vite.config.js
resolve: {
    alias: {
        '@aaix/laravel-islands-datagrid': fileURLToPath(
            new URL('./vendor/aaix/laravel-islands-datagrid/resources/js', import.meta.url),
        ),
    },
},
```

```css
@source '../vendor/aaix/laravel-islands-datagrid/resources/js/**/*';
```

## A table in full

```vue
<script setup>
import { useIsland, useTranslations } from '@aaix/laravel-islands/vue';
import { DataTable, useDataTable } from '@aaix/laravel-islands-datagrid/vue';
import ProductRow from './components/ProductRow.vue';

const props = useIsland().props;
const { t } = useTranslations();

const DEFAULTS = {
    q: '',
    status: '',
    sort: 'created_at',
    dir: 'desc',
    page: 1,
    perPage: 30,
};

const { state, rows, meta, loading, error, onSearchInput, setSort, goToPage, setPerPage, reload, fetchData } =
    useDataTable(props.dataUrl, { defaults: DEFAULTS, initial: props.initial });

onMounted(() => fetchData());
</script>

<template>
    <DataTable
        :rows="rows"
        :meta="meta"
        :per-page="state.perPage"
        :col-count="3"
        :loading="loading"
        :error="error"
        :error-message="t('Could not load products')"
        @retry="reload()"
        @page-change="goToPage"
        @per-page-change="setPerPage"
    >
        <template #toolbar>
            <input type="search" :value="state.q" @input="onSearchInput($event.target.value)" />
        </template>

        <template #head>
            <th>{{ t('SKU') }}</th>
            <th>{{ t('Name') }}</th>
            <th><button @click="setSort('created_at')">{{ t('Created') }}</button></th>
        </template>

        <ProductRow v-for="row in rows" :key="row.id" :row="row" />

        <template #empty>
            <p>{{ t('No products found') }}</p>
        </template>
    </DataTable>
</template>
```

The endpoint answers with `{ data: { rows: [...], meta: {...} } }`. Anything
else you put in `data` is available as `payload` — use it for tab counts, group
headers or aggregates.

## Documentation

Full documentation lives in [`docs/`](docs/) and is published with VitePress.

## License

MIT.
