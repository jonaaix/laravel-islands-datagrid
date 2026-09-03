# Quickstart

A list with search, one filter, sortable columns and pagination, in an island named
`Invoices` scaffolded with `php artisan make:island Invoices`.

## 1. The Query

```php
class InvoicesQuery
{
    public const SORTABLE = ['number', 'customer', 'total', 'created_at'];

    public const STATUSES = ['open', 'paid', 'overdue'];

    public function data(Request $request): array
    {
        $sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        $perPage = PerPageEnum::sanitize((int) $request->query('perPage', 30));
        $status = in_array($request->query('status'), self::STATUSES, true) ? $request->query('status') : null;

        $paginator = Invoice::query()
            ->when($request->query('q'), fn ($query, $q) => $query->where('number', 'like', "%{$q}%"))
            ->when($status, fn ($query) => $query->where('status', $status))
            ->orderBy($sort, $dir)
            ->paginate($perPage, ['*'], 'page', max(1, (int) $request->query('page', 1)));

        return [
            'rows' => $paginator->getCollection()->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'customer' => $invoice->customer,
                'total' => $invoice->total,
                'status' => $invoice->status,
            ])->all(),
            'meta' => [
                'paginated' => true,
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'lastPage' => $paginator->lastPage(),
                'from' => $paginator->firstItem() ?? 0,
                'to' => $paginator->lastItem() ?? 0,
            ],
        ];
    }
}
```

The scaffolded controller already returns `['data' => $this->query->data($request)]`
from `GET data` — fill in its `authorizeAccess()`.

## 2. The Props

```php
public function build(Request $request): array
{
    return [
        'dataUrl' => route('islands.invoices.data'),
        'statuses' => ['open' => 'Open', 'paid' => 'Paid', 'overdue' => 'Overdue'],
        'initial' => [
            'status' => in_array($request->query('status'), InvoicesQuery::STATUSES, true) ? $request->query('status') : '',
        ],
    ];
}
```

## 3. The Component

```vue
<script setup>
import { onMounted } from 'vue';
import { useIsland, useTranslations, useViewWidth } from '@aaix/laravel-islands/vue';
import { Combobox, DataTable, SearchInput, SortButton, provideDatagrid, useDataTable } from '@aaix/laravel-islands-datagrid/vue';
import InvoiceRow from './Components/InvoiceRow.vue';

const { props, _island } = useIsland();
const { t } = useTranslations();
provideDatagrid({ t, locale: _island.locale });

const { root, rootStyle } = useViewWidth();

const DEFAULTS = { q: '', status: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30 };

const { state, rows, meta, loading, error, onSearchInput, clearSearch, setFilter, setSort, goToPage, setPerPage, reload, fetchData } =
    useDataTable(props.dataUrl, { defaults: DEFAULTS, initial: props.initial, filterKeys: ['status'] });

onMounted(fetchData);
</script>

<template>
    <div ref="root" :style="rootStyle" class="mx-auto w-full">
        <DataTable
            :rows="rows" :meta="meta" :per-page="state.perPage" :col-count="4"
            :loading="loading" :error="error" :error-message="t('Could not load invoices')"
            floating-footer
            @retry="reload()" @page-change="goToPage" @per-page-change="setPerPage"
        >
            <template #toolbar>
                <SearchInput :model-value="state.q" :placeholder="t('Search invoices…')" @update:model-value="onSearchInput" @clear="clearSearch()" />
                <Combobox :model-value="state.status" :options="props.statuses" empty-value="" :placeholder="t('Status')" :all-label="t('All statuses')" variant="filter" @update:model-value="(value) => setFilter('status', value)" />
            </template>

            <template #head>
                <th><SortButton field="number" :label="t('Number')" :sort="state.sort" :dir="state.dir" @sort="setSort" /></th>
                <th><SortButton field="customer" :label="t('Customer')" :sort="state.sort" :dir="state.dir" @sort="setSort" /></th>
                <th class="text-right"><SortButton field="total" :label="t('Total')" :sort="state.sort" :dir="state.dir" @sort="setSort" /></th>
                <th>{{ t('Status') }}</th>
            </template>

            <InvoiceRow v-for="row in rows" :key="row.id" :row="row" />

            <template #empty>
                <p class="py-10 text-center text-gray-500">{{ t('No invoices match your search.') }}</p>
            </template>
        </DataTable>
    </div>
</template>
```

The row component's root is a `<tr>`. Typing searches after a short pause, the filter
resets to page one, the headers sort, the URL follows every change and the back button
undoes it.
