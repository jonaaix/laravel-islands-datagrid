# DataTable

The card around a table: sticky toolbar, error banner, `<table>` scaffold,
skeleton rows, empty state, pagination and the refresh bar.

```vue
import { DataTable } from '@aaix/laravel-islands-datagrid/vue';
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `Array` | — | **Required.** Used to tell "loading" from "empty". |
| `meta` | `Object` | `{}` | Pagination meta from the response. |
| `perPage` | `Number \| String` | `30` | Current page size. |
| `perPageOptions` | `Array` | — | Page-size choices. Left out, the pagination bar offers `[5, 10, 30, 50, 100, 200]`. |
| `colCount` | `Number` | — | **Required.** Column count for the skeleton and empty-state `colspan`. |
| `loading` | `Boolean` | `false` | Shows skeletons when there are no rows yet, the refresh bar otherwise. |
| `error` | `Boolean` | `false` | Shows the error banner. |
| `errorMessage` | `String` | `'Could not load data'` | Text in the error banner. |
| `skeletonRows` | `Number` | `10` | How many skeleton rows to render. |
| `skeletonCellClass` | `String` | `'px-6 py-3'` | Padding of a skeleton cell — match your row height. |
| `skeletonBarClass` | `String` | `'h-6'` | Height of the shimmer bar. |
| `floatingToolbar` | `Boolean` | `false` | Once the toolbar would leave the screen, it lifts off as a glass pill over the rows. |
| `floatingFooter` | `Boolean` | `false` | The same for the pagination bar. |
| `floatTopOffset` | `Number` | `12` | Room above the floating toolbar, for whatever sits at the top of the page. |
| `floatBottomOffset` | `Number` | `12` | Room below the floating footer. |
| `mode` | `String` | `'table'` | `'table'` renders the classic `<table>`; `'cards'` renders a responsive grid from the `#cards` slot. See [View modes](#view-modes). |
| `cardsMinWidth` | `String` | `'260px'` | Auto-fit minimum column width for the cards grid. |
| `cardsGap` | `String` | `'0.75rem'` | Gap between cards. |
| `cardSkeletonHeight` | `String` | `'240px'` | Height of a placeholder card while rows load. |
| `cardSkeletonCount` | `Number` | `8` | How many placeholder cards to render. |

The floating variants keep the page's own scroll: the originals stay in place, so
nothing shifts, and a copy hovers while they are out of view. Reach for them
instead of turning the table into an inner scroll container to pin its header.

## Events

| Event | Payload | Fired when |
| --- | --- | --- |
| `retry` | — | The retry button in the error banner is pressed. |
| `page-change` | `page` | A page is selected. |
| `per-page-change` | `perPage` | The page size changes. |

Wire them straight to the composable:

```vue
@retry="reload()"
@page-change="goToPage"
@per-page-change="setPerPage"
```

## Slots

| Slot | Renders into | Notes |
| --- | --- | --- |
| `toolbar` | The sticky bar above the table | A flex row with `gap-2`. One `ml-auto` starts the right-hand group — see [Toolbar order](#toolbar-order). |
| `head` | The header `<tr>` | Provide `<th>` cells only — the row is supplied. Ignored in `cards` mode. |
| default | `<tbody>` | Your row components, typically `v-for` over `rows`. Ignored in `cards` mode. |
| `cards` | The cards grid | Rendered in `cards` mode instead of `<table>`. Your card components, typically `v-for` over `rows`. |
| `empty` | The empty-state cell | Rendered inside a `<td colspan>` in table mode and inside a centered wrapper in cards mode. |

## View modes

`<DataTable>` renders either a table or a card grid, controlled by the `mode`
prop. The chrome — toolbar, error banner, pagination — is the same either way,
so a mode switch never rebuilds the frame around it.

```vue
<DataTable :mode="state.mode" …>
    <template #head>…</template>       <!-- table columns, unused in cards mode -->
    <template #default>                <!-- table rows, unused in cards mode -->
        <ProductRow v-for="row in rows" :key="row.id" :row="row" />
    </template>
    <template #cards>                  <!-- cards grid, unused in table mode -->
        <ProductCard v-for="row in rows" :key="row.id" :row="row" />
    </template>
</DataTable>
```

The grid is a plain auto-fit CSS grid with `minmax(cardsMinWidth, 1fr)`, so it
lays itself out on any screen without media queries in your code. Change the
tile size for the whole grid via `cardsMinWidth`.

See `ViewModeToggle`, `SortMenu`, `GridCard` and `useAutoCardMode` below for the
pieces most cards views need.

## Toolbar order

Left to right, the toolbar reads: what narrows the list first — search, then the
filters that live in the bar — and the controls that act on the view itself at
the right-hand end, in this order:

```
search · filters                    [display] views · columns · filters ▸ table
```

1. **views** — `ViewProfileMenu`
2. **columns** — `ColumnPicker`
3. **filters** — the button that opens `FilterPanel`

The order holds even where one of the three is missing, so a reader who learns it
once finds the same control in the same place in every table. Anything that
changes how a row *reads* rather than which rows appear — a net/gross switch, a
card size — starts the right-hand group, ahead of the three.

Only the first control of that group carries `ml-auto`. A second one splits the
remaining space instead of adding to it, which pushes everything before it into
the middle of the row.

Nothing enforces this; it is a convention, and a table that breaks it looks
broken to somebody who uses the others.

## Styling

The card carries `rounded-xl`, a flat `ring-1` and no shadow. Extra classes go
on the component and are merged onto the card:

```vue
<DataTable class="min-w-0 flex-1" …>
```

The toolbar has no fixed height unless you ask for one. Set `--table-toolbar-h`
on an ancestor to pin it — useful when a side panel's header must line up with
the toolbar:

```js
const rootStyle = computed(() => ({ '--table-toolbar-h': '61px' }));
```

## Related components

All exported from the same entry point. `<DataTable>` renders `Pagination` for
you; the rest are building blocks for the toolbar and side panels.

### SearchInput

The toolbar search field, including the clear button. Never hand-roll it — that
is how one table ends up with a clear button and the next one without.

```vue
<SearchInput
    :model-value="state.q"
    :placeholder="t('Search products or SKUs…')"
    @update:model-value="onSearchInput"
    @clear="clearSearch()"
/>
```

Props: `modelValue`, `placeholder`, `clearLabel`. Emits: `update:modelValue`,
`clear`. Wire `update:modelValue` to `onSearchInput` (debounced) and `clear` to
`clearSearch` (immediate).

### Combobox

A filterable single-select with a clear button on the trigger.

| Prop | Default | Purpose |
| --- | --- | --- |
| `modelValue` | `0` | Selected value. |
| `options` | `{}` | `{ value: label }` map, or `[{ value, label }]`. |
| `placeholder`, `searchPlaceholder`, `allLabel`, `emptyLabel` | — | Labels. |
| `emptyValue` | `0` | Value emitted when cleared. **Pass `""` when your filter default is an empty string**, or the cleared state will not match the default and will linger in the URL. |
| `searchValues` | `false` | Also match the option *value* when filtering — for code-like keys such as country codes. |
| `fetchOptions` | `null` | `(query) => Promise<options>`. Turns the list lazy — see below. |
| `fetchDelay` | `150` | Debounce before calling `fetchOptions`, in ms. |
| `selectedLabel` | `''` | Fallback label for the current selection when it is not in the preloaded set. |
| `loadingLabel` | `''` | Overrides the default `Loading…` row. |

### Lazy options

`options` holds everything by default, and the list is filtered in the browser.
That is right for short lists and wrong for long ones: a thousand entries are
serialized into the page on every load, whether or not anyone opens the
dropdown.

Pass `fetchOptions` and the component preloads only what you give it, then asks
the server as soon as someone types:

```vue
<Combobox
    :model-value="state.brand"
    :options="props.brandOptions"          <!-- the first page, e.g. 50 -->
    :selected-label="props.brandLabel"     <!-- for a selection outside that set -->
    :fetch-options="(q) => fetchBrands(q)"
    @update:model-value="setBrand"
/>
```

`fetchOptions` returns the same shapes as `options` — `{ value: label }` or
`[{ value, label }]`. Clearing the search restores the preloaded set. Stale
responses are discarded by a request id, so fast typing cannot leave an older
list on screen.

**Pass `selectedLabel` whenever the list is lazy.** A value arriving from a
deep link is usually not in the preloaded page, and without it the trigger
falls back to the placeholder instead of showing what is selected. It is a
fallback, not an override: a selection made in the browser wins, and the
component remembers its label across open and close, because a lazy list
discards its fetched options when the menu shuts.

Slots: `option` (an entry in the list) and `selected` (the trigger). When only
`option` is given, the trigger reuses it — which is what you want for a badge,
but not when the list entry carries extra detail:

```vue
<template #selected="{ label }">
    <span class="max-w-[12rem] truncate">{{ label }}</span>
</template>

<template #option="{ keyValue, label }">
    <span class="truncate">{{ label }}</span>
    <span class="ml-auto shrink-0 text-xs text-gray-400">{{ String(keyValue).toUpperCase() }}</span>
</template>
```

### SortButton

The clickable header cell that carries a column's sort control. Emits `sort`
with the field name; the parent flips direction — same contract as `SortMenu`,
so a table's header buttons and a `SortMenu` in the toolbar share one handler.

```vue
<th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
    <SortButton
        field="updated_at"
        :label="t('Updated')"
        :sort="state.sort"
        :dir="state.dir"
        @sort="setSort"
    />
</th>
```

Props:

| Prop | Default | Purpose |
| --- | --- | --- |
| `field` | — | Required. Sort key emitted on click. |
| `label` | — | Required. Text shown by default, and the tooltip / aria-label when compact. |
| `icon` | `''` | Name in the island's icon registry. Renders instead of the label. |
| `short` | `''` | A one- or two-letter substitute for the label in tight columns. |
| `sort` | `''` | Current sort field — the button lights up when it matches. |
| `dir` | `'desc'` | Current direction — the arrow rotates when it is `'asc'`. |

`icon` uses `provideIcons()` from `@aaix/laravel-islands`; the island keeps the
registry, the button reads it.

### ViewModeToggle

Segmented control between the table and cards modes. Two icons, one aria-pressed
button each, with tooltips carrying the labels — the wording is always yours.

```vue
<ViewModeToggle
    :model-value="state.mode"
    :labels="{ table: t('Table'), cards: t('Cards') }"
    @update:model-value="setMode"
/>
```

The Switch component from `@aaix/laravel-islands` says "on/off"; a mode toggle
says "A or B". The segmented control shows both options at once so the reader
always knows which one they are in.

### SortMenu

A compact dropdown for a fixed list of sort fields. Picking a field emits
`sort` with the field name, following the same contract as the header
SortButtons — the parent handles direction. Reach for it in cards mode, where
`<th>`s are gone, or anywhere a header row is too dense.

```vue
<SortMenu
    :options="[
        { field: 'updated_at', label: t('Updated') },
        { field: 'created_at', label: t('Created') },
        { field: 'price',      label: t('Price') },
    ]"
    :sort="state.sort"
    :dir="state.dir"
    :label="t('Sort by')"
    @sort="setSort"
/>
```

### GridCard, GridCardMedia

Building blocks for anything the `#cards` slot renders. They carry no domain
knowledge — a `rounded-xl` card surface, a 3:2 media frame, and slots. Use them
or roll your own markup; the datagrid never enforces a card layout.

```vue
<GridCard :href="row.url" :active="row.id === selectedId">
    <template #media>
        <GridCardMedia>
            <img :src="row.image_url" class="h-full w-full object-cover" />
        </GridCardMedia>
    </template>
    <template #header>
        <h3 class="text-base font-semibold">{{ row.name }}</h3>
    </template>
    <p class="text-sm text-gray-600 dark:text-gray-300">{{ row.summary }}</p>
    <template #footer>
        <span class="text-xs text-gray-500">{{ formatDate(row.updated_at) }}</span>
    </template>
</GridCard>
```

### useAutoCardMode

Turns on cards on narrow viewports the first time a reader lands on the page,
but only until they pick a mode themselves. A `?mode=…` in the URL also counts
as a choice — a shared link keeps its intent on arrival.

```js
useAutoCardMode({
    state,                   // reactive state from useDataTable
    key: 'products',         // namespace in sessionStorage
    breakpoint: '(max-width: 767px)',
})
```

Wrap the toggle's `update` in your own handler and call `markChosen()` if you
want the auto-switch to step back before the user's first pick lands — usually
not needed, because the state mutation itself already syncs to the URL and that
counts as a choice.
