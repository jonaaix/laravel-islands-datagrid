# Building a Table

The component needs two things from its host: the endpoint URL, and — for deep
links — the initial state. Where they come from is not this package's concern.
The examples below read them from an island payload via `useIsland().props`,
but ordinary component props work just as well, whether the page around the
table is rendered by Blade, Filament or Inertia.

## A complete island

```vue
<script setup>
import { onMounted } from 'vue';
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

const { state, rows, meta, loading, error, onSearchInput, setSort, setFilter, goToPage, setPerPage, reload, fetchData } =
    useDataTable(props.dataUrl, {
        defaults: DEFAULTS,
        initial: props.initial,
        filterKeys: ['status'],
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
            <th>
                <button type="button" @click="setSort('created_at')">{{ t('Created') }}</button>
            </th>
        </template>

        <ProductRow v-for="row in rows" :key="row.id" :row="row" />

        <template #empty>
            <p>{{ state.q ? t('No products match your search') : t('No products found') }}</p>
        </template>
    </DataTable>
</template>
```

`DEFAULTS` is the contract. Declare the full shape up front — never add keys to
`state` afterwards, or they will be missing from the request and the URL.

## Domain rules stay in the island

Two filters that exclude each other are page logic, not framework logic. Mutate
state directly and reload once, so a single request goes out:

```js
function toggleOnline() {
    state.online = state.online ? 0 : 1;
    if (state.online) {
        state.sold_out = 0;
    }
    reload({ resetPage: true });
}
```

`setFilter` already resets to page one. When you mutate `state` yourself, pass
`{ resetPage: true }`.

## Tabs, groups and counts

Anything the endpoint returns beyond `rows` and `meta` lands in `payload`:

```js
const { payload } = useDataTable(props.dataUrl, { defaults: DEFAULTS });

const tabCounts = computed(() => payload.value.tabs ?? {});
const groups = computed(() => payload.value.groups ?? []);
const grouped = computed(() => Boolean(payload.value.grouped));
```

Tab switching is island logic — it is a filter with a different shape:

```js
function setTab(tab) {
    if (state.tab === tab) {
        return;
    }

    state.tab = tab;
    state.page = 1;
    reload();
}
```

## View toggles that never reach the server

Column visibility and similar view state belongs in `state` — it should survive
a reload and be deep-linkable — but must not be sent to the endpoint. List those
keys as `clientOnly`:

```js
useDataTable(props.dataUrl, {
    defaults: { ...DEFAULTS, showGross: false, showWeight: true },
    clientOnly: ['showGross', 'showWeight'],
});
```

Booleans are mirrored into the URL as `1` and `0`.

## Layout around the table

`<DataTable>` renders the card and nothing outside it. Page headers, tabs and
side panels stay in the island. Extra classes go straight on the component:

```vue
<DataTable class="min-w-0 flex-1" …>
```

When the toolbar needs a fixed height — to line a side panel's header up with
it, for instance — set the custom property on an ancestor:

```js
const rootStyle = computed(() => ({ '--table-toolbar-h': '61px' }));
```
