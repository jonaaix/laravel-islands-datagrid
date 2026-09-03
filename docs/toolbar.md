# Toolbar & Filters

The toolbar is the `#toolbar` slot of `DataTable`, and the package ships every control a
list toolbar tends to need. This page describes each one and the order they belong in,
so every list in the application reads the same way.

![The toolbar: search, standard filters, quick filters, and the icon cluster on the right](/screenshots/toolbar.webp)

## The Canonical Order

```vue
<template #toolbar>
    <SearchInput … />
    <Combobox … />                       <!-- two to four standard filters -->
    <OptionStrip … />                    <!-- quick filters, optional -->

    <ViewProfileMenu class="ml-auto" … />  <!-- opens the right-hand cluster -->
    <SortMenu v-if="state.mode !== 'table'" … />
    <ColumnPicker v-if="state.mode === 'table'" … />
    <IconButton :label="t('Filters')" size="lg" @click="toggleFilters">
        <IconFilter />
        <span v-if="activeFilterCount" class="badge">{{ activeFilterCount }}</span>
    </IconButton>
    <OptionStrip v-model="state.mode" variant="segmented" … />
</template>
```

- **Search is always there**, first. No list turns it off.
- **Standard filters** — the two to four almost every reader reaches for — sit beside it
  as `Combobox`es.
- **Advanced filters** — date ranges, thresholds, cross-cutting flags — live in the
  `FilterPanel`, opened by the filter toggle with the `activeFilterCount` badge.
- **The right-hand cluster** — views, sort, columns, filter toggle, view mode — lands in
  the same spot in every table, so a reader's muscle memory carries over.

Every control is 36px tall (`size="lg"` on the icon buttons), so the row reads as one
line.

## `SearchInput`

```vue
<SearchInput
    ref="search"
    :model-value="state.q"
    :placeholder="t('Search name, number or customer…')"
    :clear-label="t('Clear search')"
    @update:model-value="onSearchInput"
    @clear="clearSearch()"
/>
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `modelValue` | `''` | Bind `state.q`. |
| `placeholder` | `''` | Say what can be searched. |
| `clearLabel` | `t('Clear search')` | Accessible label of the × button, which appears once there is text. |

Events: `update:modelValue` → `onSearchInput`, `clear` → `clearSearch`. The ref exposes
`focus()` and `selectAll()`. Enter selects the whole term, so a barcode scanner's next
scan overwrites the previous one instead of appending.

## `Combobox`

The base package's searchable select, re-exported here because it is the standard filter
control. Its full reference is under the base package's
[Selects](https://jonaaix.github.io/laravel-islands/helpers/selects#combobox). The three
things that matter in a toolbar:

```vue
<Combobox
    :model-value="state.brand"
    :options="props.brands"
    :empty-value="0"
    :placeholder="t('Brand')"
    :all-label="t('All brands')"
    variant="filter"
    @update:model-value="(value) => setFilter('brand', value)"
/>
```

- **`emptyValue` must match the filter's default** in `DEFAULTS`. It defaults to `0`;
  pass `""` for a string filter, or clearing writes `0` into the state and the URL.
- **`variant="filter"`** tints the trigger while a value is set, so an active filter is
  visible at a glance. The default `field` variant is for forms and must not be used here.
- **Long lists** pass `fetchOptions` and `selectedLabel`, so the options come from the
  server per search and a deep-linked value outside the preloaded page still shows its
  name.

## Quick Filters

A row of pills for the one-word filters a reader toggles all day — Online, Sold out,
In stock. The base package's `OptionStrip` with `clearable`:

```vue
<OptionStrip
    :model-value="state.quick"
    :options="[{ value: 'online', label: t('Online') }, { value: 'sold_out', label: t('Sold out') }]"
    clearable
    @update:model-value="(value) => setFilter('quick', value ?? '')"
/>
```

## `SortButton`

Sorting from the column header, in table mode. Renders the label with an arrow that
rotates for ascending and dims when the column is not the active sort.

```vue
<th><SortButton field="total" :label="t('Total')" :sort="state.sort" :dir="state.dir" @sort="setSort" /></th>
<th><SortButton field="weight" :label="t('Weight')" icon="o-scale" :sort="state.sort" :dir="state.dir" @sort="setSort" /></th>
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `field` | required | The sort key sent to the server. |
| `label` | required | The column name — shown, or used as tooltip when `icon` or `short` is set. |
| `icon` | `''` | An icon name from your set, for a narrow column. |
| `short` | `''` | An abbreviation, for a narrow column. |
| `sort`, `dir` | `''`, `'desc'` | The current state. |

Event: `sort(field)` → `setSort`.

## `SortMenu`

Sorting from the toolbar, for cards and list mode where there is no header.

```vue
<SortMenu :options="sortOptions" :sort="state.sort" :dir="state.dir" :label="t('Sort by')" @sort="setSort" />
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `options` | required | `{ field, label }[]`. |
| `sort`, `dir` | `''`, `'desc'` | The current state. The active option shows its direction. |
| `label` | `t('Sort by')` | Accessible label of the button. |

Picking an option closes the menu; picking the active one again flips the direction.

## `ColumnPicker`

Lets the reader choose which columns to show. The visible keys are client-only state,
kept in the URL and saved as a per-user preference.

![The column picker with the locked Product column greyed out](/screenshots/column-picker.webp)

```vue
<ColumnPicker
    :columns="COLUMNS"
    :visible="visibleColumnKeys"
    :changed="state.cols !== DEFAULTS.cols"
    :label="t('Columns')"
    :reset-label="t('Reset columns')"
    @update="setColumns"
    @reset="setColumns(DEFAULT_COLUMN_KEYS)"
/>
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `columns` | required | `{ key, label, locked? }[]`. A locked column cannot be hidden. |
| `visible` | required | The keys currently shown. |
| `changed` | `false` | Shows the count badge on the button and the reset row at the bottom. |
| `label`, `resetLabel` | translated | |

Events: `update(keys)` — in the order the columns were registered — and `reset`.

`colCount` on the `DataTable` must follow the visible columns, conditional ones
included. Derive it from the same list:

```js
const visibleColumns = computed(() => COLUMNS.filter((column) => visibleColumnKeys.value.includes(column.key)));
const colCount = computed(() => visibleColumns.value.reduce((sum, column) => sum + (column.span ?? 1), 0));
```

## `FilterPanel`

A panel beside the table for the filters that would make the toolbar too dense. It
docks on the right while there is room and floats over the table otherwise; the reader's
choice to keep it open is remembered.

![The filter panel docked to the right of the table](/screenshots/filter-panel.webp)

```vue
<script setup>
import { useFilterPanelDock } from '@aaix/laravel-islands-datagrid/vue';

const { root, rootStyle, headerStyle, filtersOpen, panelRendered, docked, toggleFilters } =
    useFilterPanelDock('invoices.filters', { panelWidth: 320 });
</script>

<template>
    <div ref="root" :style="rootStyle" class="island-view mx-auto w-full">
        <PageHeading :style="headerStyle" … />

        <div class="flex items-start gap-4">
            <DataTable class="min-w-0 flex-1" …>
                <template #toolbar>
                    …
                    <IconButton :label="t('Filters')" size="lg" :tone="filtersOpen ? 'active' : 'quiet'" @click="toggleFilters">
                        <IconFilter />
                    </IconButton>
                </template>
            </DataTable>

            <FilterPanel
                v-if="panelRendered"
                v-show="filtersOpen"
                :title="t('Filters')"
                :class="docked ? 'w-80 shrink-0' : 'fixed right-4 top-20 z-10 w-80'"
                @close="toggleFilters"
            >
                <FieldCaption>{{ t('Created') }}</FieldCaption>
                <TextField type="date" :model-value="state.created_from" @update:model-value="(v) => setFilter('created_from', v)" />
                …
                <template #footer>
                    <Button tone="secondary" size="sm" :disabled="!activeFilterCount" @click="resetFilters">{{ t('Reset filters') }}</Button>
                </template>
            </FilterPanel>
        </div>
    </div>
</template>
```

`useFilterPanelDock(storageKey, options)` wraps `useViewWidth()`: it returns the same
`root` and `rootStyle`, and widens the view by the panel's width while the panel is
docked, so the table keeps its size instead of shrinking.

| Option | Default | Purpose |
| --- | --- | --- |
| `baseWidth` | `1536` | The view's base width. |
| `panelWidth` | `320` | The panel's width; the view widens by this plus a gap. |
| `enabled` | `null` | A ref that disables docking — on a phone, for instance. |

| Returns | Meaning |
| --- | --- |
| `filtersOpen` | Whether the panel is open. Persisted under `storageKey` in `localStorage`. |
| `panelRendered` | Turns `true` on first open and stays, so the panel keeps its state when hidden. |
| `docked` | Whether there is room to dock. |
| `headerStyle` | A `maxWidth` for the page header, so it stays aligned with the table while the panel docks. |
| `toggleFilters()` | |

`FilterPanel` itself takes a `title` and emits `close`. Its slots: default for the
scrolling body, `#tabs` above it, `#footer` below with a divider.

## `ViewProfileMenu`

The saved-views control. It belongs at the start of the right-hand cluster and carries
the `ml-auto`. Its reference is under [Saved Views](/saved-views).

## Icons

The toolbar icons the package uses are exported as components, so a list can add the
same glyphs without redrawing them:

`IconSearch`, `IconFilter`, `IconColumns`, `IconSort`, `IconViews`, `IconStar`,
`IconModeTable`, `IconModeCards`, `IconModeList`, `IconChevronRight`. Each is a bare
`<svg>` that takes its size and colour from the caller's classes.
