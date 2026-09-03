# Introduction

Laravel Islands Datagrid is a data table for [Laravel Islands](https://jonaaix.github.io/laravel-islands/).
It owns what is the same in every list — fetching, state, the URL, the shell around the
rows, the toolbar controls, pagination, selection and saved views — and leaves what
differs to you: the columns, the rows, the filters and the rules of the domain.

## How It Fits Together

**An endpoint** answers `GET` requests with rows and metadata under a `data` envelope.

**A component** declares its state as one `defaults` object, hands it to `useDataTable()`
and renders the result through `DataTable`:

```vue
<script setup>
import { onMounted } from 'vue';
import { DataTable, SearchInput, useDataTable } from '@aaix/laravel-islands-datagrid/vue';

const DEFAULTS = { q: '', status: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30 };

const { state, rows, meta, loading, error, onSearchInput, clearSearch, goToPage, setPerPage, reload, fetchData } =
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
race guard — follows from `defaults`. Everything the shell does — skeleton, empty state,
error banner, pagination — follows from `rows`, `meta`, `loading` and `error`.

## What the Package Provides

| | |
| --- | --- |
| `useDataTable` | State, request, URL sync, history, search debounce, race guard |
| `DataTable` | The card, toolbar slot, skeleton, empty and error states, table / cards / list modes, floating bars |
| Toolbar controls | `SearchInput`, `Combobox`, `SortMenu`, `SortButton`, `ColumnPicker`, `FilterPanel`, `ViewProfileMenu` |
| `Pagination` | A sliding window of seven pages, per-page and jump-to-page selects |
| `useSelection` | Page and matching-set selection for bulk actions |
| Saved views | `useViewProfiles`, `ViewProfileMenu` and the PHP endpoints, store and schema |

## Requirements

| | |
| --- | --- |
| PHP | 8.3 or newer |
| Laravel | 12 or 13 |
| Laravel Islands | 1.0.31 or newer |
| Vue | 3.4 or newer |
| Tailwind CSS | 4 |
