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
| `head` | The header `<tr>` | Provide `<th>` cells only — the row is supplied. |
| default | `<tbody>` | Your row components, typically `v-for` over `rows`. |
| `empty` | The empty-state `<td>` | The `<tr>`/`<td>` wrapper with `colspan` is supplied. |

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
