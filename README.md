<p align="center">
  <a href="https://github.com/jonaaix/laravel-islands-datagrid">
    <img src="https://jonaaix.github.io/laravel-islands-datagrid/logo.svg" alt="Laravel Islands DataGrid Logo" width="200">
  </a>
</p>

<h1 align="center">Laravel Islands DataGrid</h1>

<p align="center">
Server-driven data tables for <a href="https://github.com/jonaaix/laravel-islands">Laravel Islands</a>. One composable for state, one shell for chrome — every table shares the same foundation instead of copying it.
</p>

<p align="center">
  <a href="https://packagist.org/packages/aaix/laravel-islands-datagrid"><img src="https://img.shields.io/packagist/v/aaix/laravel-islands-datagrid.svg?style=flat-square" alt="Latest Version on Packagist"></a>
  <a href="https://packagist.org/packages/aaix/laravel-islands-datagrid"><img src="https://img.shields.io/packagist/dt/aaix/laravel-islands-datagrid.svg?style=flat-square" alt="Total Downloads"></a>
  <a href="https://github.com/jonaaix/laravel-islands-datagrid/blob/main/LICENSE.md"><img src="https://img.shields.io/packagist/l/aaix/laravel-islands-datagrid.svg?style=flat-square" alt="License"></a>
</p>

---

Framework-agnostic core with a Vue adapter today. `useDataTable` owns the state — fetching, sorting, filtering, pagination, debounced search, query-string sync. `<DataTable>` owns the chrome — toolbar, header, skeleton, empty state, pagination. Columns and rows stay in your island, where they belong.

```bash
composer require aaix/laravel-islands-datagrid
```

```vue
<script setup>
import { DataTable, useDataTable } from '@aaix/laravel-islands-datagrid/vue';

const { rows, meta, state, loading, error, goToPage, setPerPage, reload, fetchData } =
    useDataTable('/api/products', {
        defaults: { q: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30 },
    });

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
        @retry="reload()"
        @page-change="goToPage"
        @per-page-change="setPerPage"
    >
        <template #head>
            <th>SKU</th>
            <th>Name</th>
            <th>Created</th>
        </template>
    </DataTable>
</template>
```

## Documentation

Full guide and API reference: **[jonaaix.github.io/laravel-islands-datagrid](https://jonaaix.github.io/laravel-islands-datagrid/)**

## License

[MIT](LICENSE.md)
