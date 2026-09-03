# Tabs & Groups

Two shapes a list often takes beyond rows: scopes above the table with a count each, and
headers between rows that sum up what follows. Both come from the endpoint and are drawn
by the island; the package supplies the state and the `payload` that carries them.

![Scopes with counts above the table, and a header row per day summing the orders below it](/screenshots/tabs-groups.webp)

## Tabs

A tab is a filter with a different shape. It is a key in `defaults`, validated by the
query, and switched by writing the state and reloading:

```js
const DEFAULTS = { tab: 'active', q: '', sort: 'created_at', dir: 'desc', page: 1, perPage: 30 };

function setTab(tab) {
    state.tab = tab;
    reload({ resetPage: true });
}
```

The counts come back with every response, in `payload`, from **one** aggregate query —
not one query per tab:

```php
return [
    'rows' => …,
    'meta' => …,
    'tabs' => [
        'active' => $counts->active,
        'unpaid' => $counts->unpaid,
        'shipped' => $counts->shipped,
        'all' => $counts->all,
    ],
];
```

The strip is the base package's `Tabs`, placed above the `DataTable`:

```vue
<Tabs
    :model-value="state.tab"
    :items="[
        { key: 'active', label: t('Active'), icon: 'o-bolt', count: payload.tabs?.active },
        { key: 'unpaid', label: t('Not paid'), icon: 'o-exclamation-triangle', count: payload.tabs?.unpaid },
        { key: 'shipped', label: t('Shipped'), icon: 'o-truck', count: payload.tabs?.shipped },
        { key: 'all', label: t('All orders'), icon: 'o-archive-box', count: payload.tabs?.all },
    ]"
    @update:model-value="setTab"
/>
```

Because `tab` is state like any other, it is in the URL, a deep link opens the right
scope, and a saved view can include it.

## Groups

Group headers are rows the endpoint interleaves or describes, and the island draws in the
default slot. Two ways to carry them:

**Grouped rows.** The endpoint returns `payload.groups`, each with a key, a label, its
aggregates and the rows that belong to it:

```php
'groups' => $rows->groupBy(fn ($row) => $row['date'])->map(fn ($rows, $date) => [
    'key' => $date,
    'label' => $formatted,
    'count' => $rows->count(),
    'total' => $rows->sum('total'),
    'rows' => $rows->values(),
])->values(),
```

```vue
<template v-for="group in payload.groups" :key="group.key">
    <tr class="bg-gray-50 dark:bg-white/5">
        <td :colspan="colCount" class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ group.label }} · {{ group.count }} · {{ formatCurrency(group.total) }}
        </td>
    </tr>
    <OrderRow v-for="row in group.rows" :key="row.id" :row="row" />
</template>
```

**A flag on the row.** For a flat list, the endpoint marks the first row of each group
and the island emits the header before it:

```vue
<template v-for="row in rows" :key="row.id">
    <tr v-if="row.group_start">…</tr>
    <OrderRow :row="row" />
</template>
```

Either way the rows keep paginating as usual — a group that straddles a page boundary
simply continues on the next page with a fresh header.

::: tip Sorting and grouping agree
A group header only makes sense while the rows are sorted by the grouping key. Tie the
two together: when the user sorts by another column, the query returns no groups, and the
template draws none.
:::

## Counts on Everything

A number that summarises something is a door: the tab count leads to the scope, the
group's total to its rows. The same `payload` that carries the counts can carry anything
else the view shows beside the rows — an aggregate line, a stock total, a warning — as
long as it comes with the same response.
