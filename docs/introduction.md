# Introduction

Laravel Islands Datagrid is a data table for [Laravel Islands](https://jonaaix.github.io/laravel-islands/).
It owns the part of a list view that is the same in every list — fetching, state, the
URL, the shell around the rows, the toolbar controls, pagination, selection and saved
views — and leaves the part that is different in every list to you: the columns, the
rows, the filters that make sense for this data, and the rules of the domain.

![A product list: toolbar with search and filters, rows with inline actions, a floating pagination bar](/screenshots/table.webp)

## Why

The second table in an application is the first problem again. Search debouncing, a
race between two responses, the page that does not reset when a filter changes, a deep
link that opens the wrong page, an empty state that says nothing — every list solves
them, and every list solves them a little differently. This package settles them once,
so a new list is a matter of declaring its state and drawing its rows.

## How It Fits Together

A list view built with this package is an island with two halves:

**An endpoint** answers `GET` requests with rows and metadata under a `data` envelope.
It receives every state key as a query parameter, validates them, and returns exactly
what the rows will draw. See [The Endpoint Contract](/endpoint).

**A component** declares its state as one `defaults` object, hands it to
`useDataTable()`, and renders the result through `DataTable`:

```vue
<script setup>
import { onMounted } from 'vue';
import { DataTable, SearchInput, useDataTable } from '@aaix/laravel-islands-datagrid/vue';

const DEFAULTS = { q: '', status: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30 };

const { state, rows, meta, loading, error, onSearchInput, clearSearch, setSort, goToPage, setPerPage, reload, fetchData } =
    useDataTable(props.dataUrl, { defaults: DEFAULTS, initial: props.initial, filterKeys: ['status'] });

onMounted(fetchData);
</script>

<template>
    <DataTable :rows="rows" :meta="meta" :per-page="state.perPage" :col-count="4" :loading="loading" :error="error"
        @retry="reload()" @page-change="goToPage" @per-page-change="setPerPage">
        <template #toolbar>
            <SearchInput :model-value="state.q" @update:model-value="onSearchInput" @clear="clearSearch()" />
        </template>
        <template #head>…</template>
        <InvoiceRow v-for="row in rows" :key="row.id" :row="row" />
    </DataTable>
</template>
```

Everything the composable does — the request, the debounce, the URL, the history, the
race guard — follows from that `defaults` object. Everything the shell does — the
skeleton, the empty state, the error banner, the floating bars — follows from the
`rows`, `meta`, `loading` and `error` it receives.

## What the Package Owns

| | |
| --- | --- |
| `useDataTable` | State from one `defaults` object, the request, URL sync, history, search debounce, race guard |
| `DataTable` | The card, the toolbar slot, skeleton, empty and error states, three view modes, floating bars |
| Toolbar controls | `SearchInput`, `Combobox`, `SortMenu`, `SortButton`, `ColumnPicker`, `FilterPanel`, `ViewProfileMenu` |
| `Pagination` | A sliding window of seven page numbers, per-page and jump-to-page selects |
| `useSelection` | Page and matching-set selection for bulk actions |
| `useViewProfiles` + PHP | Saved views: endpoints, ownership, sharing, defaults, a payload schema |
| `useAutoMobileMode`, `useFilterPanelDock`, `useViewWidth` | The responsive behaviour every list shares |

## What Stays With You

The page header, the tab strip, the columns and the row component, the filters and
their validation, the presenters that turn a model into a row, and every domain rule.
The package never renders a cell.

## Requirements

| | |
| --- | --- |
| PHP | 8.3 or newer |
| Laravel | 12 or 13 |
| Laravel Islands | 1.0.31 or newer — this package builds on its runtime and helpers |
| Vue | 3.4 or newer |
| Tailwind CSS | 4 |
