# Toolbar & Filters

The `#toolbar` slot of `DataTable`, in the same order in every list:

```vue
<template #toolbar>
    <SearchInput … />
    <Combobox … />                          <!-- two to four standard filters -->
    <ViewProfileMenu class="ml-auto" … />   <!-- opens the right-hand cluster -->
    <SortMenu v-if="state.mode !== 'table'" … />
    <ColumnPicker v-if="state.mode === 'table'" … />
    <IconButton :label="t('Filters')" size="lg" @click="toggleFilters"><IconFilter /></IconButton>
    <OptionStrip v-model="state.mode" variant="segmented" … />
</template>
```

Search is always first. Standard filters sit beside it; advanced ones live in the
`FilterPanel` behind the filter toggle, which carries an `activeFilterCount` badge.
Every control is 36px tall, so the row reads as one line.

## `SearchInput`

```vue
<SearchInput :model-value="state.q" :placeholder="t('Search…')" @update:model-value="onSearchInput" @clear="clearSearch()" />
```

Props `modelValue`, `placeholder`, `clearLabel`; emits `update:modelValue` and `clear`.
Enter selects the whole term, so a barcode scanner's next scan overwrites it.

## `Combobox`

The base package's searchable select, re-exported as the standard filter control:

```vue
<Combobox :model-value="state.brand" :options="props.brands" :empty-value="0" :placeholder="t('Brand')" :all-label="t('All brands')" variant="filter" @update:model-value="(value) => setFilter('brand', value)" />
```

- `emptyValue` must equal the filter's default in `DEFAULTS` (`0` by default; pass `""`
  for a string filter).
- `variant="filter"` tints the trigger while a value is set. The default `field` variant
  is for forms.
- Long lists pass `fetchOptions(query)` and `selectedLabel`.

## `SortButton` and `SortMenu`

```vue
<th><SortButton field="total" :label="t('Total')" :sort="state.sort" :dir="state.dir" @sort="setSort" /></th>

<SortMenu :options="sortOptions" :sort="state.sort" :dir="state.dir" @sort="setSort" />
```

`SortButton` sits in a `<th>` in table mode; `icon` or `short` shrink it for a narrow
column. `SortMenu` takes `{ field, label }[]` and replaces the header in cards and list
mode.

## `ColumnPicker`

```vue
<ColumnPicker :columns="COLUMNS" :visible="visibleKeys" :changed="state.cols !== DEFAULTS.cols" @update="setColumns" @reset="setColumns(DEFAULT_KEYS)" />
```

`columns` is `{ key, label, locked? }[]`; `update` emits the visible keys in register
order. The visible keys are client-only state, kept in the URL and saved as a per-user
preference. `colCount` on the `DataTable` must follow them.

## `FilterPanel`

A panel beside the table for the filters that would make the toolbar too dense. It docks
on the right while there is room and floats over the table otherwise:

```vue
<script setup>
const { root, rootStyle, headerStyle, filtersOpen, panelRendered, docked, toggleFilters } =
    useFilterPanelDock('invoices.filters', { panelWidth: 320 });
</script>

<template>
    <div ref="root" :style="rootStyle" class="mx-auto w-full">
        <div class="flex items-start gap-4">
            <DataTable class="min-w-0 flex-1" …>…</DataTable>

            <FilterPanel v-if="panelRendered" v-show="filtersOpen" :title="t('Filters')"
                :class="docked ? 'w-80 shrink-0' : 'fixed right-4 top-20 z-10 w-80'" @close="toggleFilters">
                …
                <template #footer>
                    <Button tone="secondary" size="sm" @click="resetFilters">{{ t('Reset filters') }}</Button>
                </template>
            </FilterPanel>
        </div>
    </div>
</template>
```

`useFilterPanelDock(storageKey, { panelWidth })` wraps `useViewWidth()`: it returns the
same `root` and `rootStyle`, widens the view while the panel is docked, and remembers
whether the panel is open. `FilterPanel` takes `title`, emits `close`, and has `tabs` and
`footer` slots beside the default one.

## Icons

`IconSearch`, `IconFilter`, `IconColumns`, `IconSort`, `IconViews`, `IconStar`,
`IconModeTable`, `IconModeCards`, `IconModeList`, `IconChevronRight` — bare `<svg>`
components sized by the caller's classes.
